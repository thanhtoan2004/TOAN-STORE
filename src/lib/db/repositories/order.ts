import { executeQuery, pool } from '../connection';
import { RedisLock } from '@/lib/redis/lock';
import { eventBus } from '@/lib/events/eventBus';
import { encrypt, decrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';

/**
 * FIX P1: Helper tái sử dụng — Hoàn tiền Gift Card + Reverse Coupon khi hủy/hoàn đơn.
 * Tránh duplicate code (trước đó copy-paste 80 dòng ở 2 chỗ).
 */
async function refundOrderSideEffects(connection: any, orderNumber: string) {
  const [orderInfo]: any = await connection.execute(
    'SELECT id, giftcard_number, giftcard_discount, voucher_code, user_id FROM orders WHERE order_number = ?',
    [orderNumber]
  );

  if (orderInfo.length === 0) return;
  const orderId = orderInfo[0].id;

  // Refund Gift Card if used
  if (orderInfo[0].giftcard_number && Number(orderInfo[0].giftcard_discount) > 0) {
    const cardNumber = orderInfo[0].giftcard_number;
    const amount = Number(orderInfo[0].giftcard_discount);

    const [cards]: any = await connection.execute(
      'SELECT id, current_balance FROM gift_cards WHERE card_number = ? FOR UPDATE',
      [cardNumber]
    );

    if (cards.length > 0) {
      const card = cards[0];
      const newBalance = Number(card.current_balance) + amount;

      await connection.execute(
        'UPDATE gift_cards SET current_balance = ?, status = ? WHERE id = ?',
        [newBalance, 'active', card.id]
      );

      await connection.execute(
        `INSERT INTO gift_card_transactions 
                 (gift_card_id, transaction_type, amount, balance_before, balance_after, description, order_id)
                 VALUES (?, 'refund', ?, ?, ?, ?, ?)`,
        [
          card.id,
          amount,
          card.current_balance,
          newBalance,
          `Hoàn tiền đơn hàng ${orderNumber}`,
          orderId,
        ]
      );
      logger.info(`[GiftCard] Refunded ${amount} to Card ${cardNumber} for order ${orderNumber}`);
    }
  }

  // Reverse Coupon Usage
  if (orderInfo[0].voucher_code) {
    await connection.execute('DELETE FROM coupon_usage WHERE order_id = ?', [orderId]);
    logger.info(`[Coupon] Reversed usage of ${orderInfo[0].voucher_code} for order ${orderNumber}`);
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
  shippingAddress:
    | string
    | {
        name: string;
        phone: string;
        address: string;
        city: string;
        district: string;
        ward: string;
      };
  phone: string;
  email: string;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  has_gift_wrapping?: boolean;
  giftWrapCost?: number;
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
    const discount = orderData.discount || 0;
    const tax = orderData.tax || 0;
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Parse shipping address
    let shippingAddr: {
      name: string;
      phone: string;
      address: string;
      city: string;
      district: string;
      ward: string;
    };
    if (typeof orderData.shippingAddress === 'string') {
      try {
        shippingAddr = JSON.parse(orderData.shippingAddress);
      } catch {
        // Nếu parse lỗi, tạo object mặc định
        shippingAddr = {
          name: orderData.phone,
          phone: orderData.phone,
          address: orderData.shippingAddress,
          city: '',
          district: '',
          ward: '',
        };
      }
    } else {
      shippingAddr = orderData.shippingAddress;
    }

    // Tạo hoặc tìm shipping address
    const addressLine = `${shippingAddr.address}, ${shippingAddr.ward}, ${shippingAddr.district}`;

    let shippingAddressId: number | null = null;
    if (orderData.userId) {
      // Check if address exists for logged-in user to link it
      const [existingAddresses]: any = await connection.execute(
        `SELECT id FROM user_addresses 
         WHERE user_id = ? AND recipient_name = ? AND phone = ? AND address_line = ? AND city = ?
         LIMIT 1`,
        [
          orderData.userId,
          shippingAddr.name,
          shippingAddr.phone,
          addressLine,
          shippingAddr.city || '',
        ]
      );

      if (existingAddresses.length > 0) {
        shippingAddressId = existingAddresses[0].id;
      }
      // IF not found, we DO NOT create a new address. We just leave shippingAddressId as null
      // and rely on shipping_address_snapshot.
    }

    // Tạo order
    const [orderResult]: any = await connection.execute(
      `INSERT INTO orders (user_id, order_number, subtotal, shipping_fee, discount, voucher_code, voucher_discount, giftcard_number, giftcard_discount, tax, total, shipping_address_id, shipping_address_snapshot, status, payment_method, payment_status, phone, phone_encrypted, email, email_encrypted, is_encrypted, notes, has_gift_wrapping, gift_wrap_cost, placed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, '***', ?, '***', ?, TRUE, ?, ?, ?, NOW())`,
      [
        orderData.userId || null,
        orderData.orderNumber,
        subtotal,
        shippingFee,
        discount,
        orderData.voucherCode || null,
        orderData.voucherDiscount || 0,
        orderData.giftcardNumber || null,
        orderData.giftcardDiscount || 0,
        tax,
        subtotal + shippingFee - discount + tax + (orderData.giftWrapCost || 0),
        shippingAddressId,
        JSON.stringify({
          ...shippingAddr,
          phone: encrypt(shippingAddr.phone),
          address: encrypt(shippingAddr.address),
          address_line: encrypt((shippingAddr as any).address_line || shippingAddr.address),
        }), // Save encrypted snapshot
        orderData.paymentMethod || 'cod',
        orderData.paymentStatus || 'pending',
        encrypt(orderData.phone),
        encrypt(orderData.email),
        orderData.notes || null,
        orderData.has_gift_wrapping ? 1 : 0,
        orderData.giftWrapCost || 0,
      ]
    );

    const orderId = orderResult.insertId;

    // SECURE: Process Gift Card Deduction IMMEDIATELY (Prevent Double Spending)
    if (orderData.giftcardNumber && orderData.giftcardDiscount && orderData.giftcardDiscount > 0) {
      const [cards]: any = await connection.execute(
        'SELECT id, current_balance, status, expires_at FROM gift_cards WHERE card_number = ? FOR UPDATE',
        [orderData.giftcardNumber]
      );

      if (cards.length === 0) {
        throw new Error('Mã thẻ quà tặng không hợp lệ');
      }

      const card = cards[0];
      if (card.status !== 'active') {
        // Assuming 'active' is the valid status
        if (card.current_balance < orderData.giftcardDiscount && card.status !== 'used') {
          // Allow if used but has dust? No.
          throw new Error('Thẻ quà tặng không khả dụng');
        }
      }

      // Check Expiry
      if (card.expires_at && new Date(card.expires_at) < new Date()) {
        throw new Error('Thẻ quà tặng đã hết hạn');
      }

      if (Number(card.current_balance) < Number(orderData.giftcardDiscount)) {
        throw new Error('Số dư thẻ quà tặng không đủ');
      }

      const newBalance = Number(card.current_balance) - Number(orderData.giftcardDiscount);
      const newStatus = newBalance === 0 ? 'used' : 'active';

      await connection.execute(
        'UPDATE gift_cards SET current_balance = ?, status = ? WHERE id = ?',
        [newBalance, newStatus, card.id]
      );

      await connection.execute(
        `INSERT INTO gift_card_transactions 
                 (gift_card_id, transaction_type, amount, balance_before, balance_after, description, order_id)
                 VALUES (?, 'redeem', ?, ?, ?, ?, ?)`,
        [
          card.id,
          orderData.giftcardDiscount,
          card.current_balance,
          newBalance,
          `Thanh toán đơn hàng ${orderData.orderNumber}`,
          orderId,
        ]
      );
    }

    // Tạo order items
    let verifiedSubtotal = 0;
    for (const item of orderData.items) {
      // Get base product price
      const [productInfo]: any = await connection.execute(
        `SELECT base_price, retail_price, cost_price FROM products WHERE id = ?`,
        [item.productId]
      );

      if (productInfo.length === 0) {
        throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại.`);
      }

      let actualUnitPrice = parseFloat(productInfo[0].retail_price || productInfo[0].base_price);

      // Check for active Flash Sale for this product
      const [flashSaleItems]: any = await connection.execute(
        `SELECT fsi.id, fsi.flash_price, fsi.quantity_limit, fsi.quantity_sold, fsi.per_user_limit, fs.id as sale_id
                 FROM flash_sale_items fsi
                 JOIN flash_sales fs ON fsi.flash_sale_id = fs.id
                 WHERE fsi.product_id = ? 
                   AND fs.is_active = 1 
                   AND fs.start_time <= NOW() 
                   AND fs.end_time > NOW()
                 LIMIT 1`,
        [item.productId]
      );

      let flashSaleItemId = null;
      if (flashSaleItems.length > 0) {
        const fs = flashSaleItems[0];
        flashSaleItemId = fs.id;

        // REDIS LOCK: Acquire lock for this product to prevent race condition
        const lockKey = `product:${item.productId}`;
        const lockId = await RedisLock.acquire(lockKey, 5000);

        if (!lockId) {
          // Failed to acquire lock - retry or fail
          // In high traffic, we might want to retry a few times.
          // For now, simpler to throw error "System busy"
          throw new Error(
            `Hệ thống đang bận xử lý sản phẩm ${item.productName}. Vui lòng thử lại.`
          );
        }

        try {
          // Override with Flash Price
          actualUnitPrice = parseFloat(fs.flash_price);

          // 2. Kiểm tra giới hạn số lượng (Quantity Limit)
          if (fs.quantity_limit !== null && fs.quantity_sold + item.quantity > fs.quantity_limit) {
            throw new Error(`Sản phẩm ${item.productName} đã hết lượt giảm giá Flash Sale.`);
          }

          // 3. Kiểm tra giới hạn mỗi người dùng (Per User Limit)
          if (orderData.userId && fs.per_user_limit > 0) {
            const [userPreviousPurchases]: any = await connection.execute(
              `SELECT SUM(oi.quantity) as total_bought
                         FROM order_items oi
                         JOIN orders o ON oi.order_id = o.id
                         WHERE o.user_id = ? 
                           AND oi.product_id = ? 
                           AND o.status != 'cancelled'
                           AND o.placed_at >= (SELECT start_time FROM flash_sales WHERE id = ?)`,
              [orderData.userId, item.productId, fs.sale_id]
            );

            const totalBought = userPreviousPurchases[0].total_bought || 0;
            if (totalBought + item.quantity > fs.per_user_limit) {
              throw new Error(
                `Bạn đã đạt giới hạn mua hàng cho sản phẩm ${item.productName} trong đợt Sale này.`
              );
            }
          }

          // 4. Tăng số lượng đã bán (quantity_sold)
          await connection.execute(
            `UPDATE flash_sale_items SET quantity_sold = quantity_sold + ? WHERE id = ?`,
            [item.quantity, fs.id]
          );
        } finally {
          // Always release lock
          await RedisLock.release(lockKey, lockId);
        }
      }

      // Find variant_id for this product and size
      const [variants]: any = await connection.execute(
        `SELECT id, sku FROM product_variants WHERE product_id = ? AND size = ? LIMIT 1`,
        [item.productId, item.size]
      );
      const variantId = variants.length > 0 ? variants[0].id : null;
      const sku = variants.length > 0 ? variants[0].sku : null;

      verifiedSubtotal += actualUnitPrice * item.quantity;

      // 1. FIND WAREHOUSE WITH STOCK OR BACKORDER ENABLED (Pessimistic Locking)
      const [stockSources]: any = await connection.execute(
        `SELECT id, warehouse_id, quantity, allow_backorder
                 FROM inventory 
                 WHERE product_variant_id = ? 
                 AND (quantity >= ? OR allow_backorder = 1)
                 ORDER BY (quantity >= ?) DESC, CASE WHEN warehouse_id = 1 THEN 0 ELSE 1 END, id ASC 
                 LIMIT 1 FOR UPDATE`,
        [variantId, item.quantity, item.quantity]
      );

      if (stockSources.length === 0) {
        throw new Error(`Sản phẩm ${item.productName} size ${item.size} hiện đã hết hàng.`);
      }

      const sourceInventoryId = stockSources[0].id;

      // 2. RESERVE STOCK (Don't just subtract quantity, move it to reserved)
      await connection.execute(
        `UPDATE inventory 
                SET quantity = quantity - ?, reserved = reserved + ?
                 WHERE id = ?`,
        [item.quantity, item.quantity, sourceInventoryId]
      );
      const actualCostPrice = parseFloat(productInfo[0].cost_price || 0);

      // 3. INSERT order_items (now we have sourceInventoryId)
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_variant_id, inventory_id, product_name, sku, size, quantity, unit_price, total_price, cost_price, flash_sale_item_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          variantId,
          sourceInventoryId,
          item.productName,
          sku,
          item.size,
          item.quantity,
          actualUnitPrice,
          actualUnitPrice * item.quantity,
          actualCostPrice,
          flashSaleItemId,
        ]
      );

      // LOG
      await connection.execute(
        `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
                     SELECT id, ?, 'order_reserved', ?
                     FROM inventory
                     WHERE id = ?`,
        [-item.quantity, orderData.orderNumber, sourceInventoryId]
      );
    }

    // Cập nhật lại tổng tiền đơn hàng với giáo đã xác thực
    const finalSubtotal = verifiedSubtotal;
    const finalTotal = finalSubtotal + shippingFee - discount + tax;

    await connection.execute(`UPDATE orders SET subtotal = ?, total = ? WHERE id = ?`, [
      finalSubtotal,
      finalTotal,
      orderId,
    ]);

    // Track coupon usage if voucher was used
    if (orderData.voucherCode && orderData.userId) {
      // Get coupon id from code
      const [coupons]: any = await connection.execute(
        `SELECT id FROM coupons WHERE code = ? LIMIT 1`,
        [orderData.voucherCode]
      );

      if (coupons.length > 0) {
        const couponId = coupons[0].id;
        // Create usage record (marked as pending until order is delivered)
        await connection.execute(
          `INSERT INTO coupon_usage (coupon_id, user_id, order_id, used_at)
           VALUES (?, ?, ?, NOW())`,
          [couponId, orderData.userId, orderId]
        );
      }
    }

    await connection.commit();

    // EMIT EVENT: Order Created (Async side effects)
    // We do this AFTER commit to ensure data is consistent
    await eventBus.publish('order.created', {
      orderId,
      orderNumber: orderData.orderNumber,
      userId: orderData.userId,
      email: orderData.email,
      shippingAddress: shippingAddr,
      items: orderData.items,
      subtotal: finalSubtotal,
      shipping: shippingFee,
      tax: tax,
      totalAmount: finalTotal,
    });

    return orderId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getOrdersByUserId(userId: number, page: number = 1, limit: number = 20) {
  // FIX P3: Added pagination (was returning ALL orders — slow for users with 500+ orders)
  // FIX P6: Explicit columns instead of SELECT * (avoid leaking PII encrypted columns)
  const offset = (page - 1) * limit;
  const safeLimit = Math.min(limit, 100);

  const query = `
    SELECT 
      o.id, o.order_number, o.status, o.subtotal, o.shipping_fee, o.discount, 
      o.voucher_code, o.voucher_discount, o.giftcard_discount, o.tax, o.total,
      o.payment_method, o.payment_status, o.has_gift_wrapping, o.gift_wrap_cost,
      o.placed_at, o.shipped_at, o.delivered_at, o.cancelled_at,
      o.is_encrypted, o.phone_encrypted, o.email_encrypted,
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

  // Get total count for pagination
  const [countResult] = await executeQuery<any[]>(
    'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
    [userId]
  );
  const total = countResult?.total || 0;

  // Helper: kiểm tra decrypt có thất bại không
  const safeDecryptFn = (encrypted: string | null | undefined): string => {
    if (!encrypted) return '';
    const result = decrypt(encrypted);
    if (result && /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(result)) return '';
    return result === '***' ? '' : result || '';
  };

  const items = orders.map(({ phone_encrypted, email_encrypted, is_encrypted, ...o }) => ({
    ...o,
    phone:
      is_encrypted && phone_encrypted
        ? safeDecryptFn(phone_encrypted)
        : o.phone !== '***'
          ? o.phone
          : '',
    email: is_encrypted && email_encrypted ? safeDecryptFn(email_encrypted) : o.email,
  }));

  return { items, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

export async function getOrderByNumber(orderNumber: string) {
  const orders = await executeQuery<any[]>(
    `SELECT 
      o.*,
      ua.recipient_name as delivery_name,
      ua.phone as delivery_phone,
      ua.phone_encrypted as delivery_phone_encrypted,
      ua.address_line as delivery_address,
      ua.address_encrypted as delivery_address_encrypted,
      ua.is_encrypted as ua_is_encrypted,
      ua.ward as delivery_ward,
      ua.district as delivery_district,
      ua.city as delivery_city,
      ua.state as delivery_state,
      ua.postal_code as delivery_postal_code
    FROM orders o
    LEFT JOIN user_addresses ua ON o.shipping_address_id = ua.id
    WHERE o.order_number = ?`,
    [orderNumber]
  );

  if (!orders || orders.length === 0) {
    return [];
  }

  const order = orders[0];

  // Fallback if delivery info is missing from linked address
  if (!order.delivery_address && order.shipping_address_snapshot) {
    try {
      const snapshot =
        typeof order.shipping_address_snapshot === 'string'
          ? JSON.parse(order.shipping_address_snapshot)
          : order.shipping_address_snapshot;

      order.delivery_name = snapshot.name || snapshot.recipient_name;
      // Snapshot stores encrypted phone/address — try to decrypt them
      order.delivery_phone_encrypted = snapshot.phone;
      order.delivery_address_encrypted = snapshot.address || snapshot.address_line;
      order.ua_is_encrypted = true; // Mark as encrypted so the decrypt logic below handles it
      order.delivery_ward = snapshot.ward;
      order.delivery_district = snapshot.district;
      order.delivery_city = snapshot.city;
    } catch (e) {
      console.error('Error parsing shipping address snapshot:', e);
    }
  }

  const items = await executeQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

  // Helper: kiểm tra decrypt có thất bại không
  const safeDecrypt = (encrypted: string | null | undefined): string => {
    if (!encrypted) return '';
    const result = decrypt(encrypted);
    // Nếu kết quả vẫn chứa pattern hex thô → decrypt thất bại ngầm
    if (result && /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(result)) {
      return '';
    }
    return result === '***' ? '' : result || '';
  };

  // Decrypt PII data
  order.phone =
    order.is_encrypted && order.phone_encrypted
      ? safeDecrypt(order.phone_encrypted)
      : order.phone !== '***'
        ? order.phone
        : '';
  order.email =
    order.is_encrypted && order.email_encrypted ? safeDecrypt(order.email_encrypted) : order.email;
  order.delivery_phone =
    order.ua_is_encrypted && order.delivery_phone_encrypted
      ? safeDecrypt(order.delivery_phone_encrypted)
      : order.delivery_phone !== '***'
        ? order.delivery_phone || ''
        : '';
  order.delivery_address =
    order.ua_is_encrypted && order.delivery_address_encrypted
      ? safeDecrypt(order.delivery_address_encrypted)
      : order.delivery_address !== '***'
        ? order.delivery_address || ''
        : '';

  // Map payment_confirmed_at to confirmed_at for the frontend timeline if needed
  order.confirmed_at = order.payment_confirmed_at;

  // Strip encrypted fields để tránh lộ chuỗi hex ra frontend
  delete order.phone_encrypted;
  delete order.email_encrypted;
  delete order.delivery_phone_encrypted;
  delete order.delivery_address_encrypted;
  delete order.is_encrypted;
  delete order.ua_is_encrypted;

  return [
    {
      ...order,
      items,
    },
  ];
}

export async function getOrderById(id: number) {
  const orders = await executeQuery<any[]>(
    `SELECT 
      o.*,
      ua.recipient_name as delivery_name,
      ua.phone as delivery_phone,
      ua.phone_encrypted as delivery_phone_encrypted,
      ua.address_line as delivery_address,
      ua.address_encrypted as delivery_address_encrypted,
      ua.is_encrypted as ua_is_encrypted,
      ua.city as delivery_city,
      ua.state as delivery_district,
      ua.postal_code as delivery_postal_code,
      u.full_name as customer_name,
      u.email as customer_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN user_addresses ua ON o.shipping_address_id = ua.id
    WHERE o.id = ?`,
    [id]
  );

  if (!orders || orders.length === 0) {
    return null;
  }

  const items = await executeQuery('SELECT * FROM order_items WHERE order_id = ?', [id]);

  const order = orders[0];

  // Helper: kiểm tra decrypt có thất bại không
  const safeDecryptFn = (encrypted: string | null | undefined): string => {
    if (!encrypted) return '';
    const result = decrypt(encrypted);
    if (result && /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(result)) return '';
    return result === '***' ? '' : result || '';
  };

  // Decrypt PII data
  order.phone =
    order.is_encrypted && order.phone_encrypted
      ? safeDecryptFn(order.phone_encrypted)
      : order.phone !== '***'
        ? order.phone
        : '';
  order.email =
    order.is_encrypted && order.email_encrypted
      ? safeDecryptFn(order.email_encrypted)
      : order.email;
  order.delivery_phone =
    order.ua_is_encrypted && order.delivery_phone_encrypted
      ? safeDecryptFn(order.delivery_phone_encrypted)
      : order.delivery_phone !== '***'
        ? order.delivery_phone || ''
        : '';
  order.delivery_address =
    order.ua_is_encrypted && order.delivery_address_encrypted
      ? safeDecryptFn(order.delivery_address_encrypted)
      : order.delivery_address !== '***'
        ? order.delivery_address || ''
        : '';

  // Strip encrypted fields
  delete order.phone_encrypted;
  delete order.email_encrypted;
  delete order.delivery_phone_encrypted;
  delete order.delivery_address_encrypted;
  delete order.is_encrypted;
  delete order.ua_is_encrypted;

  return {
    ...order,
    items,
  };
}

export async function updateOrderStatus(orderNumber: string, status: string) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 0. Fetch current order to validate transition and get items
    const [currentOrder]: any = await connection.execute(
      'SELECT id, status, payment_method, payment_confirmed_at FROM orders WHERE order_number = ? FOR UPDATE',
      [orderNumber]
    );

    if (!currentOrder || currentOrder.length === 0) {
      throw new Error('Order not found');
    }

    const oldStatus = currentOrder[0].status;
    const paymentMethod = currentOrder[0].payment_method;

    // Idempotency check: If status is already the same, return early
    if (oldStatus === status) {
      await connection.commit();
      return { success: true, message: 'Status already up-to-date' };
    }

    // 1. Validate State Machine Transition
    const { isValidStatusTransition, getStockAction } = await import('@/lib/order-logic');
    if (!isValidStatusTransition(oldStatus, status)) {
      throw new Error(`Invalid status transition from ${oldStatus} to ${status}`);
    }

    // 2. Cập nhật trạng thái đơn hàng và timestamp tương ứng
    let updateQuery = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [status];

    // Add timestamps based on status
    if (status === 'confirmed' || status === 'processing') {
      // Chỉ cập nhật nếu chưa có (để tránh ghi đè khi chuyển qua lại giữa confirmed/processing)
      // Fix: Không set payment_confirmed_at cho COD khi mới Processing (thanh toán khi nhận hàng)
      if (!currentOrder[0].payment_confirmed_at && paymentMethod !== 'cod') {
        updateQuery += ', payment_confirmed_at = COALESCE(payment_confirmed_at, CURRENT_TIMESTAMP)';
      }
    } else if (status === 'shipped') {
      updateQuery += ', shipped_at = CURRENT_TIMESTAMP';
    } else if (status === 'delivered') {
      updateQuery += ', delivered_at = CURRENT_TIMESTAMP';
      // Fix: For COD, Delivered means Paid
      if (paymentMethod === 'cod') {
        updateQuery += ", payment_status = 'paid', payment_confirmed_at = CURRENT_TIMESTAMP";
      }
    }

    updateQuery += ' WHERE order_number = ?';
    params.push(orderNumber);

    await connection.execute(updateQuery, params);

    // 3. Handle Stock Action based on State Machine
    const action = getStockAction(oldStatus, status);
    if (action !== 'none') {
      const [items]: any = await connection.execute(
        'SELECT inventory_id, quantity FROM order_items WHERE order_id = ?',
        [currentOrder[0].id]
      );

      for (const item of items) {
        if (action === 'finalize') {
          // Confirmation/Payment received -> Remove from reserved
          await connection.execute(
            'UPDATE inventory SET reserved = GREATEST(0, reserved - ?) WHERE id = ?',
            [item.quantity, item.inventory_id]
          );
        } else if (action === 'release') {
          if (oldStatus === 'delivered') {
            // Return from Delivered -> Just increment quantity (as it was already finalized)
            await connection.execute(`UPDATE inventory SET quantity = quantity + ? WHERE id = ?`, [
              item.quantity,
              item.inventory_id,
            ]);
          } else {
            // Cancellation from Pending -> Move from reserved back to quantity
            await connection.execute(
              `UPDATE inventory SET quantity = quantity + ?, reserved = GREATEST(0, reserved - ?) WHERE id = ?`,
              [item.quantity, item.quantity, item.inventory_id]
            );
          }

          // Log the release
          await connection.execute(
            `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
                         VALUES (?, ?, ?, ?)`,
            [
              item.inventory_id,
              item.quantity,
              status === 'refunded' ? 'order_refunded' : 'order_cancelled',
              orderNumber,
            ]
          );
        }
      }
    }

    // 4. Handle Refund/Cancellation Side Effects (Gift Card & Coupon)
    // FIX P1: Extracted to helper function (was duplicated 80 lines)
    if (status === 'refunded' || status === 'cancelled') {
      await refundOrderSideEffects(connection, orderNumber);
    }

    // 5. Point Reversal & Tier Downgrade (If moving from delivered -> refunded/cancelled)
    if (oldStatus === 'delivered' && (status === 'refunded' || status === 'cancelled')) {
      const [orders]: any = await connection.execute(
        'SELECT user_id, total FROM orders WHERE order_number = ?',
        [orderNumber]
      );

      if (orders.length > 0 && orders[0].user_id) {
        const userId = orders[0].user_id;
        const total = Number(orders[0].total);
        const pointsToDeduct = Math.floor(total / 10000);

        if (pointsToDeduct > 0) {
          const [users]: any = await connection.execute(
            'SELECT available_points, lifetime_points FROM users WHERE id = ? FOR UPDATE',
            [userId]
          );
          if (users.length > 0) {
            const currentAvailable = users[0].available_points || 0;
            const currentLifetime = users[0].lifetime_points || 0;
            const newAvailable = Math.max(0, currentAvailable - pointsToDeduct);
            const newLifetime = Math.max(0, currentLifetime - pointsToDeduct);

            let newTier = 'bronze';
            if (newLifetime >= 10000) newTier = 'platinum';
            else if (newLifetime >= 5000) newTier = 'gold';
            else if (newLifetime >= 1000) newTier = 'silver';

            await connection.execute(
              'UPDATE users SET available_points = ?, lifetime_points = ?, membership_tier = ? WHERE id = ?',
              [newAvailable, newLifetime, newTier, userId]
            );

            // Log point deduction
            await connection.execute(
              `INSERT INTO point_transactions (user_id, points, type, description, balance_after, source, source_id)
               VALUES (?, ?, 'refund', ?, ?, 'order', ?)`,
              [
                userId,
                -pointsToDeduct,
                `Deducted due to order ${orderNumber} refund/cancellation`,
                newAvailable,
                orderNumber,
              ]
            );

            logger.info(
              `[Points] Deducted ${pointsToDeduct} from User ${userId} due to order refund.`
            );
          }
        }
      }
    }

    // 5. Nếu trạng thái là 'delivered', tính điểm và cập nhật hạng thành viên
    if (status === 'delivered') {
      // Lấy thông tin đơn hàng
      const [orders]: any = await connection.execute(
        'SELECT id, user_id, total, giftcard_number, giftcard_discount FROM orders WHERE order_number = ?',
        [orderNumber]
      );

      if (orders.length > 0) {
        const order = orders[0];
        const userId = order.user_id;
        const total = Number(order.total);
        const orderId = order.id;

        // A. Tính điểm tích lũy
        if (userId) {
          const pointsEarned = Math.floor(total / 10000);
          if (pointsEarned > 0) {
            const [users]: any = await connection.execute(
              'SELECT available_points, lifetime_points, membership_tier, email, full_name FROM users WHERE id = ? FOR UPDATE',
              [userId]
            );
            if (users.length > 0) {
              const currentAvailable = users[0].available_points || 0;
              const currentLifetime = users[0].lifetime_points || 0;
              const oldTier = users[0].membership_tier || 'bronze';
              const newAvailable = currentAvailable + pointsEarned;
              const newLifetime = currentLifetime + pointsEarned;

              let newTier = 'bronze';
              if (newLifetime >= 10000) newTier = 'platinum';
              else if (newLifetime >= 5000) newTier = 'gold';
              else if (newLifetime >= 1000) newTier = 'silver';

              await connection.execute(
                'UPDATE users SET available_points = ?, lifetime_points = ?, membership_tier = ? WHERE id = ?',
                [newAvailable, newLifetime, newTier, userId]
              );

              // Log point earning
              await connection.execute(
                `INSERT INTO point_transactions (user_id, points, type, description, balance_after, source, source_id)
                 VALUES (?, ?, 'earn', ?, ?, 'order', ?)`,
                [
                  userId,
                  pointsEarned,
                  `Earned from order ${orderNumber}`,
                  newAvailable,
                  orderNumber,
                ]
              );

              // Tier Upgrade Notification
              if (newTier !== oldTier) {
                const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
                if (tierOrder.indexOf(newTier) > tierOrder.indexOf(oldTier)) {
                  // Fire-and-forget tier upgrade notification
                  eventBus
                    .publish('tier.upgraded', {
                      userId,
                      email: users[0].email,
                      fullName: users[0].full_name,
                      oldTier,
                      newTier,
                      totalPoints: newLifetime,
                    })
                    .catch(() => {});
                }
              }
            }
          }
        }

        // B. (Removed) Gift Card processing is now handled in createOrder to prevent double-spending.
        // The order record already contains the applied discount.
      }
    }

    await connection.commit();

    // EMIT EVENT: Order Updated
    if (oldStatus !== status) {
      logger.info(`📡 Publishing order.updated: ${orderNumber} ${oldStatus} -> ${status}`);
      await eventBus.publish('order.updated', {
        orderId: currentOrder[0].id,
        orderNumber,
        oldStatus,
        newStatus: status,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function cancelOrder(
  orderNumber: string | { orderNumber: string },
  force: boolean = false
) {
  const connection = await pool.getConnection();
  const actualOrderNumber = typeof orderNumber === 'string' ? orderNumber : orderNumber.orderNumber;

  try {
    await connection.beginTransaction();

    // Lấy order info
    const [order] = await connection.execute<any[]>(
      'SELECT id, status FROM orders WHERE order_number = ?',
      [actualOrderNumber]
    );

    if (!order || order.length === 0) {
      throw new Error('Order not found');
    }

    // Nếu không phải force (Admin), chỉ cho phép hủy đơn pending
    if (!force && order[0].status !== 'pending') {
      throw new Error('Can only cancel pending orders');
    }

    // Lấy order items
    const [items] = await connection.execute<any[]>(
      'SELECT inventory_id, product_id, size, quantity, flash_sale_item_id FROM order_items WHERE order_id = ?',
      [order[0].id]
    );

    // REFUND Gift Card if used
    const [orderInfo]: any = await connection.execute(
      'SELECT giftcard_number, giftcard_discount FROM orders WHERE id = ?',
      [order[0].id]
    );

    if (
      orderInfo.length > 0 &&
      orderInfo[0].giftcard_number &&
      Number(orderInfo[0].giftcard_discount) > 0
    ) {
      const cardNumber = orderInfo[0].giftcard_number;
      const amount = Number(orderInfo[0].giftcard_discount);

      const [cards]: any = await connection.execute(
        'SELECT id, current_balance FROM gift_cards WHERE card_number = ? FOR UPDATE',
        [cardNumber]
      );

      if (cards.length > 0) {
        const card = cards[0];
        const newBalance = Number(card.current_balance) + amount;

        await connection.execute(
          'UPDATE gift_cards SET current_balance = ?, status = ? WHERE id = ?',
          [newBalance, 'active', card.id]
        );

        await connection.execute(
          `INSERT INTO gift_card_transactions 
                     (gift_card_id, transaction_type, amount, balance_before, balance_after, description, order_id)
                     VALUES (?, 'refund', ?, ?, ?, ?, ?)`,
          [
            card.id,
            amount,
            card.current_balance,
            newBalance,
            `Hoàn tiền đơn hàng ${actualOrderNumber}`,
            order[0].id,
          ]
        );
      }
    }

    // Hoàn lại stock sử dụng hệ thống inventory mới
    for (const item of items as any[]) {
      // Hoàn lại số lượng Flash Sale nếu có
      if (item.flash_sale_item_id) {
        await connection.execute(
          `UPDATE flash_sale_items SET quantity_sold = quantity_sold - ? WHERE id = ?`,
          [item.quantity, item.flash_sale_item_id]
        );
      }

      let targetInventoryId: any = null;
      if (item.inventory_id) {
        // Restore from reserved to quantity based on tracked inventory_id
        await connection.execute(
          `UPDATE inventory SET quantity = quantity + ?, reserved = reserved - ? WHERE id = ?`,
          [item.quantity, item.quantity, item.inventory_id]
        );
        targetInventoryId = item.inventory_id;
      } else {
        // Fallback for old orders
        const [variantRows]: any = await connection.execute(
          'SELECT product_variant_id FROM order_items WHERE order_id = ? AND product_id = ? AND size = ? LIMIT 1',
          [order[0].id, item.product_id, item.size]
        );
        const variantId = variantRows[0]?.product_variant_id;
        if (!variantId) continue;

        const [mainInv]: any = await connection.execute(
          'SELECT id FROM inventory WHERE product_variant_id = ? AND warehouse_id = 1 LIMIT 1',
          [variantId]
        );

        if (mainInv.length > 0) {
          targetInventoryId = mainInv[0].id;
          await connection.execute(
            `UPDATE inventory SET quantity = quantity + ?, reserved = reserved - ? WHERE id = ?`,
            [item.quantity, item.quantity, targetInventoryId]
          );
        } else {
          const [anyInv]: any = await connection.execute(
            'SELECT id FROM inventory WHERE product_variant_id = ? AND reserved >= ? LIMIT 1',
            [variantId, item.quantity]
          );
          if (anyInv.length > 0) {
            targetInventoryId = anyInv[0].id;
            await connection.execute(
              `UPDATE inventory SET quantity = quantity + ?, reserved = reserved - ? WHERE id = ?`,
              [item.quantity, item.quantity, targetInventoryId]
            );
          } else {
            const [newInv]: any = await connection.execute(
              `INSERT INTO inventory (product_variant_id, quantity, warehouse_id) VALUES (?, ?, 1)`,
              [variantId, item.quantity]
            );
            targetInventoryId = newInv.insertId;
          }
        }
      }

      // Ghi log
      if (targetInventoryId) {
        await connection.execute(
          `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
                     VALUES (?, ?, 'order_cancelled', ?)`,
          [targetInventoryId, item.quantity, actualOrderNumber]
        );
      }
    }

    // Cập nhật status
    await connection.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?',
      ['cancelled', actualOrderNumber]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function searchOrderForChat(orderNumber: string) {
  try {
    const orders = await executeQuery<any[]>(
      `SELECT o.order_number, o.status, o.total, o.payment_status, o.created_at,
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o
       WHERE o.order_number = ?
       LIMIT 1`,
      [orderNumber]
    );

    if (!orders || orders.length === 0) return null;
    return orders[0];
  } catch (error) {
    console.error('Chatbot Order Search Error:', error);
    return null;
  }
}

export async function getOrderStatusForChat(orderNumber: string, phone: string) {
  try {
    // FIX: Encrypt generates random IV, so we cannot query by exact match.
    // Strategy: Fetch by Order Number first, then decrypt and compare phone.
    const query = `
        SELECT o.order_number, o.status, o.total, o.payment_status, o.placed_at, o.phone,
               (SELECT JSON_ARRAYAGG(JSON_OBJECT('name', product_name, 'quantity', quantity, 'price', unit_price)) 
                FROM order_items WHERE order_id = o.id) as items
        FROM orders o
        WHERE o.order_number = ?
        LIMIT 1`;

    const orders: any[] = await executeQuery<any[]>(query, [orderNumber]);

    if (!orders || orders.length === 0) return null;

    const order = orders[0];
    const decryptedPhone = decrypt(order.phone);

    // Normalize phones for comparison (remove spaces, etc if needed, but strict for now)
    if (decryptedPhone !== phone) {
      console.log(
        `[Chatbot] Phone mismatch for order ${orderNumber}. Input: ${phone}, Stored: ${decryptedPhone}`
      );
      return null;
    }

    // Remove sensitive phone before returning
    delete order.phone;

    return order;
  } catch (error) {
    console.error('Chatbot Order Status Error:', error);
    return null;
  }
}

/**
 * Cleanup expired pending orders
 * Tự động hủy các đơn hàng 'pending' quá hạn (mặc định 30 phút) để giải phóng kho
 */
export async function cleanupExpiredOrders(expirationMinutes: number = 30) {
  try {
    const [expiredOrders]: any = await executeQuery<any[]>(
      `SELECT order_number FROM orders 
             WHERE status = 'pending' 
               AND placed_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
             LIMIT 50`, // Giới hạn mỗi lần chạy để tránh treo hệ thống
      [expirationMinutes]
    );

    if (expiredOrders.length === 0) return 0;

    console.log(`[Cron] Found ${expiredOrders.length} expired orders to cleanup.`);

    let count = 0;
    for (const order of expiredOrders) {
      try {
        await cancelOrder(order.order_number, true); // force = true
        count++;
      } catch (error) {
        console.error(`[Cron] Failed to cancel expired order ${order.order_number}:`, error);
      }
    }

    return count;
  } catch (error) {
    console.error('[Cron] Cleanup Expired Orders Error:', error);
    return 0;
  }
}
