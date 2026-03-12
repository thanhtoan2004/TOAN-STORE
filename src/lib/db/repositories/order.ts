import { executeQuery, pool } from '../connection';
import { RedisLock } from '@/lib/redis/lock';
import { eventBus } from '@/lib/events/eventBus';
import { encrypt, decrypt, hashEmail } from '@/lib/security/encryption';
import { logger } from '@/lib/utils/logger';
import { isValidStatusTransition, getStockAction } from '@/lib/orders/order-logic';

/**
 * Helper to handle side effects when an order is cancelled or refunded
 */
async function refundOrderSideEffects(connection: any, orderNumber: string) {
  const [orderInfo]: any = await connection.execute(
    'SELECT id, promotion_code FROM orders WHERE order_number = ?',
    [orderNumber]
  );

  if (orderInfo.length === 0) return;
  const orderId = orderInfo[0].id;

  // 1. REFUND Gift Card if used
  const [giftTransactions]: any = await connection.execute(
    'SELECT gift_card_id, amount FROM gift_card_transactions WHERE order_id = ? AND transaction_type = "redeem"',
    [orderId]
  );

  for (const trans of giftTransactions) {
    const [cards]: any = await connection.execute(
      'SELECT current_balance FROM gift_cards WHERE id = ? FOR UPDATE',
      [trans.gift_card_id]
    );

    if (cards.length > 0) {
      const newBalance = Number(cards[0].current_balance) + Number(trans.amount);
      await connection.execute(
        'UPDATE gift_cards SET current_balance = ?, status = "active" WHERE id = ?',
        [newBalance, trans.gift_card_id]
      );

      await connection.execute(
        `INSERT INTO gift_card_transactions 
         (gift_card_id, transaction_type, amount, balance_before, balance_after, description, order_id)
         VALUES (?, 'refund', ?, ?, ?, ?, ?)`,
        [
          trans.gift_card_id,
          trans.amount,
          cards[0].current_balance,
          newBalance,
          `Hoàn tiền đơn hàng ${orderNumber}`,
          orderId,
        ]
      );
    }
  }

  // 2. Reverse Coupon Usage
  if (orderInfo[0].promotion_code) {
    await connection.execute('DELETE FROM coupon_usage WHERE order_id = ?', [orderId]);
    logger.info(
      `[Coupon] Reversed usage of ${orderInfo[0].promotion_code} for order ${orderNumber}`
    );
  }
}

// Order functions
export async function createOrder(orderData: {
  userId?: number;
  orderNumber: string;
  totalAmount: number;
  shippingFee?: number;
  discount?: number;
  tax?: number;
  voucherCode?: string | null;
  voucherDiscount?: number;
  giftcardNumber?: string | null;
  giftcardDiscount?: number;
  shippingAddress: any;
  phone: string;
  email: string;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  items: Array<{
    productId: number;
    productName: string;
    productImage: string;
    size: string;
    quantity: number;
    price: number;
  }>;
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const shippingFee = orderData.shippingFee || 0;
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = subtotal + shippingFee - (orderData.discount || 0) + (orderData.tax || 0);

    let shippingAddr =
      typeof orderData.shippingAddress === 'string'
        ? JSON.parse(orderData.shippingAddress)
        : orderData.shippingAddress;

    // 1. Create Order (Unified Table Mapping)
    // SECURITY: Full Masking for phone/email in snapshot plus separate columns
    const emailHash = hashEmail(shippingAddr.email);
    const snapshot = JSON.stringify({
      ...shippingAddr,
      phone: encrypt(shippingAddr.phone),
      email: encrypt(shippingAddr.email),
      address: encrypt(shippingAddr.address),
    });

    const [orderResult]: any = await connection.execute(
      `INSERT INTO orders (
        user_id, order_number, subtotal, total, status, notes, 
        is_encrypted, shipping_address_snapshot, phone, email, email_hash,
        shipping_fee, tax, promotion_code, voucher_discount, giftcard_discount, placed_at
      )
       VALUES (?, ?, ?, ?, 'pending', ?, TRUE, ?, '***', '***', ?, ?, ?, ?, ?, ?, NOW())`,
      [
        orderData.userId || null,
        orderData.orderNumber,
        subtotal,
        totalAmount,
        orderData.notes || null,
        snapshot,
        emailHash,
        shippingFee,
        orderData.tax || 0,
        orderData.voucherCode || null,
        orderData.voucherDiscount || 0,
        orderData.giftcardDiscount || 0,
      ]
    );

    const orderId = orderResult.insertId;

    // 2. Process Voucher/Coupon Usage (Atomic)
    if (orderData.voucherCode) {
      // Try updating coupons first
      const [couponUpdate]: any = await connection.execute(
        `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount)
         SELECT id, ?, ?, ? FROM coupons WHERE code = ?`,
        [orderData.userId || null, orderId, orderData.voucherDiscount || 0, orderData.voucherCode]
      );

      if (couponUpdate.affectedRows === 0) {
        // Redaction: Update personal voucher status to redeemed
        await connection.execute(
          `UPDATE vouchers SET status = 'redeemed', redeemed_at = NOW() 
           WHERE code = ? AND status = 'active'`,
          [orderData.voucherCode]
        );
      }
    }

    // 3. Process Gift Card (Secure)
    if (orderData.giftcardNumber && orderData.giftcardDiscount && orderData.giftcardDiscount > 0) {
      const [cards]: any = await connection.execute(
        'SELECT id, current_balance, status FROM gift_cards WHERE card_number = ? FOR UPDATE',
        [orderData.giftcardNumber]
      );

      if (cards.length > 0) {
        const card = cards[0];
        const newBalance = Number(card.current_balance) - Number(orderData.giftcardDiscount);
        await connection.execute(
          'UPDATE gift_cards SET current_balance = ?, status = ? WHERE id = ?',
          [newBalance, newBalance <= 0 ? 'used' : 'active', card.id]
        );

        await connection.execute(
          `INSERT INTO gift_card_transactions (gift_card_id, transaction_type, amount, balance_before, balance_after, description, order_id)
           VALUES (?, 'redeem', ?, ?, ?, ?, ?)`,
          [
            card.id,
            orderData.giftcardDiscount,
            card.current_balance,
            newBalance,
            `Thanh toán đơn ${orderData.orderNumber}`,
            orderId,
          ]
        );
      }
    }

    // 4. Create Order Items & stock reservation
    for (const item of orderData.items) {
      const [variants]: any = await connection.execute(
        'SELECT id, sku FROM product_variants WHERE product_id = ? AND size = ? LIMIT 1',
        [item.productId, item.size]
      );
      const variantId = variants[0]?.id;

      const [products]: any = await connection.execute(
        'SELECT cost_price FROM products WHERE id = ? LIMIT 1',
        [item.productId]
      );
      const costPrice = products[0]?.cost_price || 0;

      const [stock]: any = await connection.execute(
        'SELECT id FROM inventory WHERE product_variant_id = ? AND quantity >= ? LIMIT 1 FOR UPDATE',
        [variantId, item.quantity]
      );

      if (!stock.length) throw new Error(`Hết hàng: ${item.productName}`);

      await connection.execute(
        'UPDATE inventory SET quantity = quantity - ?, reserved = reserved + ? WHERE id = ?',
        [item.quantity, item.quantity, stock[0].id]
      );

      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_variant_id, inventory_id, product_name, sku, size, quantity, unit_price, cost_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          variantId,
          stock[0].id,
          item.productName,
          variants[0]?.sku,
          item.size,
          item.quantity,
          item.price,
          costPrice,
          item.price * item.quantity,
        ]
      );
    }

    await connection.commit();
    eventBus
      .publish('order.created', { orderId, orderNumber: orderData.orderNumber })
      .catch(() => {});
    return orderId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getOrdersByUserId(userId: number, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const safeLimit = Math.min(limit, 100);

  const query = `
    SELECT 
      o.id, o.order_number, o.status, o.subtotal, o.total,
      o.placed_at,
      COUNT(DISTINCT oi.id) as item_count,
      (SELECT url FROM product_images pi 
       JOIN order_items oi2 ON pi.product_id = oi2.product_id 
       WHERE oi2.order_id = o.id AND pi.is_main = 1 
       LIMIT 1) as preview_image
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.placed_at DESC
    LIMIT ? OFFSET ?`;

  const orders = await executeQuery<any[]>(query, [userId, safeLimit, offset]);
  const [countResult]: any = await executeQuery(
    'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
    [userId]
  );

  return {
    items: orders,
    total: countResult[0]?.total || 0,
    page,
    limit: safeLimit,
  };
}

export async function getOrderByNumber(orderNumber: string) {
  return await executeQuery<any[]>(`SELECT * FROM orders WHERE order_number = ?`, [orderNumber]);
}

export async function getOrderById(id: number) {
  const rows = await executeQuery<any[]>(
    `SELECT o.*, u.full_name as user_name, u.email as user_email 
     FROM orders o 
     LEFT JOIN users u ON o.user_id = u.id 
     WHERE o.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Update Order Status with Business Logic (Stock, Events, etc.)
 */
export async function updateOrderStatus(orderNumber: string, status: string) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get current order
    const [currentOrder]: any = await connection.execute(
      'SELECT id, status, order_number FROM orders WHERE order_number = ? FOR UPDATE',
      [orderNumber]
    );

    if (currentOrder.length === 0) throw new Error('Order not found');
    const oldStatus = currentOrder[0].status;

    // 2. Validate Transition
    if (!isValidStatusTransition(oldStatus, status)) {
      throw new Error(`Invalid status transition from ${oldStatus} to ${status}`);
    }

    // 3. Determine Stock Action
    const stockAction = getStockAction(oldStatus, status);

    if (stockAction !== 'none') {
      const [items]: any = await connection.execute(
        'SELECT inventory_id, quantity FROM order_items WHERE order_id = ?',
        [currentOrder[0].id]
      );

      for (const item of items) {
        if (stockAction === 'finalize') {
          // Move from reserved to finalized (already deducted from quantity in createOrder, just clear reserved)
          await connection.execute(
            'UPDATE inventory SET reserved = GREATEST(0, reserved - ?) WHERE id = ?',
            [item.quantity, item.inventory_id]
          );
        } else if (stockAction === 'release') {
          // Restore quantity and clear reserved
          await connection.execute(
            'UPDATE inventory SET quantity = quantity + ?, reserved = GREATEST(0, reserved - ?) WHERE id = ?',
            [item.quantity, item.quantity, item.inventory_id]
          );
        }
      }
    }

    // 4. If status is refunded, handle side effects
    if (status === 'refunded') {
      await refundOrderSideEffects(connection, orderNumber);
    }

    // 5. Update Status & Timestamps
    let timestampField = '';
    if (status === 'cancelled') {
      timestampField = ', cancelled_at = NOW()';
    } else if (['payment_received', 'confirmed', 'processing'].includes(status)) {
      timestampField = ', payment_confirmed_at = COALESCE(payment_confirmed_at, NOW())';
    } else if (status === 'shipped') {
      timestampField = ', shipped_at = COALESCE(shipped_at, NOW())';
    } else if (status === 'delivered') {
      timestampField = ', delivered_at = COALESCE(delivered_at, NOW())';
    }

    await connection.execute(
      `UPDATE orders SET status = ? ${timestampField} WHERE order_number = ?`,
      [status, orderNumber]
    );

    await connection.commit();

    // 6. Emit Event
    if (oldStatus !== status) {
      eventBus
        .publish('order.updated', {
          orderId: currentOrder[0].id,
          orderNumber,
          oldStatus,
          newStatus: status,
          timestamp: new Date(),
        })
        .catch(console.error);
    }

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Cancel Order Logic (Wraps updateOrderStatus with specific checks)
 */
export async function cancelOrder(orderNumber: string, force: boolean = false) {
  const order = (await getOrderByNumber(orderNumber)) as any;
  if (!order || order.length === 0) throw new Error('Order not found');

  const currentStatus = order[0].status;

  if (!force) {
    // Regular users can only cancel pending orders
    if (currentStatus !== 'pending') {
      throw new Error('Only pending orders can be cancelled by user');
    }
  }

  return await updateOrderStatus(orderNumber, 'cancelled');
}
