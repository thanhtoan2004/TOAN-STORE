import { db } from '../drizzle';
import {
  orders,
  orderItems,
  giftCards,
  giftCardTransactions,
  couponUsage,
  vouchers,
  coupons,
  inventory,
  productVariants,
  products,
  productImages,
  categories,
  users,
  flashSaleItems,
  pointTransactions,
} from '../schema';
import { eq, and, sql, desc, lt, count, isNull } from 'drizzle-orm';
import { eventBus } from '@/lib/events/eventBus';
import { encrypt, decrypt, hashEmail, hashGiftCard } from '@/lib/security/encryption';
import { logger } from '@/lib/utils/logger';
import { isValidStatusTransition, getStockAction } from '@/lib/orders/order-logic';

/**
 * Helper to handle side effects when an order is cancelled or refunded
 */
async function refundOrderSideEffects(tx: any, orderNumber: string) {
  const [orderInfo] = await tx
    .select({ id: orders.id, promotionCode: orders.promotionCode })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!orderInfo) return;
  const orderId = orderInfo.id;

  // 1. REFUND Gift Card if used
  const giftTransactions = await tx
    .select({ giftCardId: giftCardTransactions.giftCardId, amount: giftCardTransactions.amount })
    .from(giftCardTransactions)
    .where(
      and(
        eq(giftCardTransactions.orderId, orderId),
        eq(giftCardTransactions.transactionType, 'redeem')
      )
    );

  for (const trans of giftTransactions) {
    const [card] = await tx
      .select({ currentBalance: giftCards.currentBalance })
      .from(giftCards)
      .where(eq(giftCards.id, trans.giftCardId))
      .for('update');

    if (card) {
      const newBalance = Number(card.currentBalance) + Number(trans.amount);
      await tx
        .update(giftCards)
        .set({ currentBalance: String(newBalance), status: 'active' })
        .where(eq(giftCards.id, trans.giftCardId));

      await tx.insert(giftCardTransactions).values({
        giftCardId: trans.giftCardId,
        transactionType: 'refund',
        amount: trans.amount,
        balanceBefore: card.currentBalance,
        balanceAfter: String(newBalance),
        description: `Hoàn tiền đơn hàng ${orderNumber}`,
        orderId: orderId,
      });
    }
  }

  // 2. Reverse Coupon/Voucher Usage
  if (orderInfo.promotionCode) {
    // Try to delete from couponUsage
    const deleteResult = await tx.delete(couponUsage).where(eq(couponUsage.orderId, orderId));

    // Also try to restore personal voucher if it was one
    await tx
      .update(vouchers)
      .set({ status: 'active', redeemedAt: null })
      .where(and(eq(vouchers.code, orderInfo.promotionCode), eq(vouchers.status, 'redeemed')));

    logger.info(
      `[Promotion] Reversed usage of ${orderInfo.promotionCode} for order ${orderNumber}`
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
  membershipDiscount?: number;
  shippingAddress: any;
  phone: string;
  email: string;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  hasGiftWrapping?: boolean;
  giftWrapCost?: number;
  items: Array<{
    productId: number;
    productName: string;
    productImage: string;
    size: string;
    quantity: number;
    price: number;
    productVariantId: number;
    sku?: string;
    costPrice?: number;
    flashSaleItemId?: number | null;
  }>;
}) {
  return await db.transaction(async (tx) => {
    const shippingFee = orderData.shippingFee || 0;
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // Automatic 10% VAT calculation if not provided by client, for financial consistency
    const taxValue = orderData.tax !== undefined ? orderData.tax : Math.round(subtotal * 0.1);

    const totalAmount =
      subtotal +
      shippingFee +
      taxValue +
      (orderData.giftWrapCost || 0) -
      (orderData.discount || 0) -
      (orderData.giftcardDiscount || 0);

    let shippingAddr =
      typeof orderData.shippingAddress === 'string'
        ? JSON.parse(orderData.shippingAddress)
        : orderData.shippingAddress;

    const emailHash = hashEmail(shippingAddr.email || orderData.email);
    const snapshot = JSON.stringify({
      ...shippingAddr,
      phone: encrypt(shippingAddr.phone || orderData.phone),
      email: encrypt(shippingAddr.email || orderData.email),
      address: encrypt(shippingAddr.address || ''),
    });

    const [orderResult] = await tx.insert(orders).values({
      userId: orderData.userId || null,
      orderNumber: orderData.orderNumber,
      subtotal: String(subtotal),
      total: String(totalAmount),
      status: 'pending',
      notes: orderData.notes || null,
      isEncrypted: 1,
      shippingAddressSnapshot: snapshot,
      phone: '***',
      email: '***',
      emailHash,
      shippingFee: String(shippingFee),
      tax: String(taxValue),
      promotionCode: orderData.voucherCode || null,
      voucherDiscount: String(orderData.voucherDiscount || 0),
      giftcardDiscount: String(orderData.giftcardDiscount || 0),
      membershipDiscount: String(orderData.membershipDiscount || 0),
      discount: String(orderData.discount || 0),
      hasGiftWrapping: orderData.hasGiftWrapping ? 1 : 0,
      giftWrapCost: String(orderData.giftWrapCost || 0),
      placedAt: new Date(),
    });

    const orderId = orderResult.insertId;

    // 2. Process Voucher/Coupon Usage (Atomic)
    if (orderData.voucherCode) {
      // Find coupon ID
      const [coupon] = await tx
        .select({ id: coupons.id })
        .from(coupons)
        .where(eq(coupons.code, orderData.voucherCode))
        .limit(1);

      if (coupon) {
        await tx.insert(couponUsage).values({
          couponId: coupon.id,
          userId: orderData.userId || null,
          orderId: orderId,
        });
      } else {
        // Redaction: Update personal voucher status to redeemed
        await tx
          .update(vouchers)
          .set({ status: 'redeemed', redeemedAt: new Date() })
          .where(and(eq(vouchers.code, orderData.voucherCode), eq(vouchers.status, 'active')));
      }
    }

    // 3. Process Gift Card (Secure)
    if (orderData.giftcardNumber && orderData.giftcardDiscount && orderData.giftcardDiscount > 0) {
      const cardHash = hashGiftCard(orderData.giftcardNumber);
      const [card] = await tx
        .select({
          id: giftCards.id,
          currentBalance: giftCards.currentBalance,
          status: giftCards.status,
        })
        .from(giftCards)
        .where(eq(giftCards.cardNumberHash, cardHash))
        .for('update');

      if (card) {
        const newBalance = Number(card.currentBalance) - Number(orderData.giftcardDiscount);
        await tx
          .update(giftCards)
          .set({
            currentBalance: String(newBalance),
            status: newBalance <= 0 ? 'used' : 'active',
          })
          .where(eq(giftCards.id, card.id));

        await tx.insert(giftCardTransactions).values({
          giftCardId: card.id,
          transactionType: 'redeem',
          amount: String(orderData.giftcardDiscount),
          balanceBefore: card.currentBalance,
          balanceAfter: String(newBalance),
          description: `Thanh toán đơn ${orderData.orderNumber}`,
          orderId: orderId,
        });
      }
    }

    // 4. Create Order Items & stock reservation
    for (const item of orderData.items) {
      const variantId = item.productVariantId;
      const costPrice = item.costPrice || 0;

      const [stockItem] = await tx
        .select({ id: inventory.id, quantity: inventory.quantity })
        .from(inventory)
        .where(
          and(
            eq(inventory.productVariantId, variantId),
            sql`${inventory.quantity} >= ${item.quantity}`
          )
        )
        .for('update');

      if (!stockItem) throw new Error(`Hết hàng: ${item.productName}`);

      await tx
        .update(inventory)
        .set({
          quantity: sql`${inventory.quantity} - ${item.quantity}`,
          reserved: sql`${inventory.reserved} + ${item.quantity}`,
        })
        .where(eq(inventory.id, stockItem.id));

      // Update Flash Sale Sold Count if applicable
      if (item.flashSaleItemId) {
        await tx
          .update(flashSaleItems)
          .set({
            quantitySold: sql`${flashSaleItems.quantitySold} + ${item.quantity}`,
          })
          .where(eq(flashSaleItems.id, item.flashSaleItemId));
      }

      await tx.insert(orderItems).values({
        orderId,
        productId: item.productId,
        productVariantId: variantId,
        inventoryId: stockItem.id,
        productName: item.productName,
        sku: item.sku || null,
        size: item.size,
        quantity: item.quantity,
        unitPrice: String(item.price),
        costPrice: String(costPrice),
        totalPrice: String(item.price * item.quantity),
        flashSaleItemId: item.flashSaleItemId || null,
      });
    }

    eventBus
      .publish('order.created', { orderId, orderNumber: orderData.orderNumber })
      .catch(() => {});

    return orderId;
  });
}

export async function getOrdersByUserId(userId: number, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const safeLimit = Math.min(limit, 100);

  const items = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      subtotal: orders.subtotal,
      total: orders.total,
      placedAt: orders.placedAt,
      itemCount: count(orderItems.id),
      previewImage: sql<string>`(SELECT url FROM ${productImages} pi 
                                JOIN ${orderItems} oi2 ON pi.product_id = oi2.product_id 
                                WHERE oi2.order_id = ${orders.id} AND pi.is_main = 1 
                                LIMIT 1)`,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(eq(orders.userId, userId))
    .groupBy(orders.id)
    .orderBy(desc(orders.placedAt))
    .limit(safeLimit)
    .offset(offset);

  const [countResult] = await db
    .select({ total: count() })
    .from(orders)
    .where(eq(orders.userId, userId));

  return {
    items,
    total: countResult?.total || 0,
    page,
    limit: safeLimit,
  };
}

export async function getOrderByNumber(orderNumber: string) {
  return await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
}

export async function getOrderById(id: number) {
  const [order] = await db
    .select({
      id: orders.id,
      order_number: orders.orderNumber,
      user_id: orders.userId,
      status: orders.status,
      total: orders.total,
      subtotal: orders.subtotal,
      shipping_fee: orders.shippingFee,
      discount: orders.discount,
      promotion_code: orders.promotionCode,
      promotion_type: orders.promotionType,
      voucher_discount: orders.voucherDiscount,
      giftcard_discount: orders.giftcardDiscount,
      tax: orders.tax,
      currency: orders.currency,
      shipping_address_snapshot: orders.shippingAddressSnapshot,
      placed_at: orders.placedAt,
      created_at: orders.createdAt,
      updated_at: orders.updatedAt,
      payment_method: orders.paymentMethod,
      payment_status: orders.paymentStatus,
      tracking_number: orders.trackingNumber,
      carrier: orders.carrier,
      shipped_at: orders.shippedAt,
      delivered_at: orders.deliveredAt,
      payment_confirmed_at: orders.paymentConfirmedAt,
      cancelled_at: orders.cancelledAt,
      notes: orders.notes,
      is_encrypted: orders.isEncrypted,
      phone: orders.phone,
      email: orders.email,
      email_hash: orders.emailHash,
      customer_name: users.fullName,
      customer_email: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) return null;

  // Trích xuất thông tin giao hàng từ snapshot
  let deliveryInfo: any = {};
  if (order.shipping_address_snapshot) {
    try {
      const snapshot =
        typeof order.shipping_address_snapshot === 'string'
          ? JSON.parse(order.shipping_address_snapshot)
          : order.shipping_address_snapshot;

      deliveryInfo = {
        delivery_name: snapshot.recipientName || snapshot.fullName || '',
        delivery_phone: snapshot.phone ? decrypt(snapshot.phone) : snapshot.phoneNumber || '',
        delivery_address: snapshot.address ? decrypt(snapshot.address) : snapshot.street || '',
        delivery_city: snapshot.city || '',
        delivery_district: snapshot.district || '',
      };
    } catch (e) {
      console.error('Error parsing shipping snapshot:', e);
    }
  }

  // Lấy danh sách sản phẩm trong đơn hàng
  const items = await db
    .select({
      id: orderItems.id,
      product_id: orderItems.productId,
      product_variant_id: orderItems.productVariantId,
      product_name: orderItems.productName,
      sku: orderItems.sku,
      size: orderItems.size,
      quantity: orderItems.quantity,
      unit_price: orderItems.unitPrice,
      total_price: orderItems.totalPrice,
      created_at: orderItems.createdAt,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  return {
    ...order,
    ...deliveryInfo,
    items: items || [],
  };
}

/**
 * Update Order Status with Business Logic (Stock, Events, etc.)
 * Supports nested transactions via the optional 'existingTx' parameter to prevent deadlocks in IPN handlers.
 */
export async function updateOrderStatus(orderNumber: string, status: string, existingTx?: any) {
  const logic = async (tx: any) => {
    // 1. Get current order
    const [currentOrder] = await tx
      .select({ id: orders.id, status: orders.status, orderNumber: orders.orderNumber })
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .for('update');

    if (!currentOrder) throw new Error('Order not found');
    const oldStatus = currentOrder.status;

    // 2. Validate Transition
    if (!isValidStatusTransition(oldStatus || 'pending', status)) {
      throw new Error(`Invalid status transition from ${oldStatus} to ${status}`);
    }

    // 3. Determine Stock Action
    const stockAction = getStockAction(oldStatus || 'pending', status);

    if (stockAction !== 'none') {
      const items = await tx
        .select({ inventoryId: orderItems.inventoryId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, currentOrder.id));

      for (const item of items) {
        if (item.inventoryId && stockAction === 'finalize') {
          // Move from reserved to finalized
          await tx
            .update(inventory)
            .set({ reserved: sql`GREATEST(0, ${inventory.reserved} - ${item.quantity})` })
            .where(eq(inventory.id, item.inventoryId!));
        } else if (item.inventoryId && stockAction === 'release') {
          // Restore quantity and clear reserved
          await tx
            .update(inventory)
            .set({
              quantity: sql`${inventory.quantity} + ${item.quantity}`,
              reserved: sql`GREATEST(0, ${inventory.reserved} - ${item.quantity})`,
            })
            .where(eq(inventory.id, item.inventoryId!));
        }
      }
    }

    // 4. If status is refunded or cancelled, handle side effects (Gift Card & Promotions)
    if (status === 'refunded' || status === 'cancelled') {
      await refundOrderSideEffects(tx, orderNumber);
    }

    // 5. Update Status & Timestamps
    const updateData: any = { status };
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    } else if (['payment_received', 'confirmed', 'processing'].includes(status)) {
      updateData.paymentConfirmedAt = sql`COALESCE(${orders.paymentConfirmedAt}, NOW())`;
    } else if (status === 'shipped') {
      updateData.shippedAt = sql`COALESCE(${orders.shippedAt}, NOW())`;
    } else if (status === 'delivered') {
      updateData.deliveredAt = sql`COALESCE(${orders.deliveredAt}, NOW())`;
    }

    await tx.update(orders).set(updateData).where(eq(orders.orderNumber, orderNumber));

    // New: If order is delivered, award points and check for tier upgrade
    if (status === 'delivered' && oldStatus !== 'delivered') {
      const orderData = await tx
        .select({ userId: orders.userId, total: orders.total })
        .from(orders)
        .where(eq(orders.orderNumber, orderNumber))
        .limit(1);

      const userId = orderData[0]?.userId;
      const totalAmount = parseFloat(orderData[0]?.total || '0');

      if (userId) {
        // 1 point per 1,000 VND spent
        const pointsEarned = Math.floor(totalAmount / 1000);

        if (pointsEarned > 0) {
          // Record point transaction
          const [user] = await tx
            .select({
              lifetimePoints: users.lifetimePoints,
              availablePoints: users.availablePoints,
              membershipTier: users.membershipTier,
              email: users.email,
              fullName: users.fullName,
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(eq(users.id, userId))
            .for('update');

          if (user) {
            const newLifetimePoints = user.lifetimePoints + pointsEarned;
            const newAvailablePoints = user.availablePoints + pointsEarned;

            // Determine new tier
            let newTier = user.membershipTier;
            if (newLifetimePoints >= 100000) newTier = 'platinum';
            else if (newLifetimePoints >= 20000) newTier = 'gold';
            else if (newLifetimePoints >= 5000) newTier = 'silver';

            // Update user
            const userUpdate: any = {
              lifetimePoints: newLifetimePoints,
              availablePoints: newAvailablePoints,
            };

            if (newTier !== user.membershipTier) {
              userUpdate.membershipTier = newTier;
              userUpdate.tierUpdatedAt = new Date();

              // Publish tier upgraded event
              eventBus
                .publish('tier.upgraded', {
                  userId,
                  email: user.email,
                  fullName:
                    user.fullName || `${user.firstName} ${user.lastName}`.trim() || 'Thành viên',
                  oldTier: user.membershipTier,
                  newTier,
                  totalPoints: newLifetimePoints,
                })
                .catch(console.error);
            }

            await tx.update(users).set(userUpdate).where(eq(users.id, userId));

            // Log point transaction
            await tx.insert(pointTransactions).values({
              userId,
              points: pointsEarned,
              type: 'earn',
              source: 'order',
              sourceId: orderNumber,
              balanceAfter: newAvailablePoints,
              description: `Tích điểm từ đơn hàng #${orderNumber}`,
            });
          }
        }
      }
    }

    // 6. Emit Event
    if (oldStatus !== status) {
      eventBus
        .publish('order.updated', {
          orderId: currentOrder.id,
          orderNumber,
          oldStatus,
          newStatus: status,
          timestamp: new Date(),
        })
        .catch(console.error);
    }

    return true;
  };

  if (existingTx) {
    return await logic(existingTx);
  }

  return await db.transaction(async (tx) => {
    return await logic(tx);
  });
}

/**
 * Cancel Order Logic (Wraps updateOrderStatus with specific checks)
 */
export async function cancelOrder(orderNumber: string, force: boolean = false) {
  const result = await getOrderByNumber(orderNumber);
  if (!result || result.length === 0) throw new Error('Order not found');
  const order = result[0];

  const currentStatus = order.status;

  if (!force) {
    // Regular users can only cancel pending orders
    if (currentStatus !== 'pending') {
      throw new Error('Only pending orders can be cancelled by user');
    }
  }

  return await updateOrderStatus(orderNumber, 'cancelled');
}

/**
 * Cron Job logic: Cancellations of "pending" orders that haven't been paid/confirmed
 * within the specified time window.
 */
export async function cleanupExpiredOrders(minutes: number = 30) {
  // 1. Find expired orders
  const expiredOrders = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'pending'),
        lt(orders.placedAt, sql`DATE_SUB(NOW(), INTERVAL ${minutes} MINUTE)`)
      )
    );

  if (expiredOrders.length === 0) return 0;

  // 2. Cancel them using the standard logic to handle stock/events
  let count = 0;
  for (const order of expiredOrders) {
    try {
      await cancelOrder(order.orderNumber, true); // force = true to allow cancellation
      count++;
    } catch (e) {
      logger.error(e, `Failed to cleanup order ${order.orderNumber}:`);
    }
  }

  return count;
}

/**
 * Chatbot-specific order lookup.
 */
export async function getOrderStatusForChat(orderNumber: string, phone: string) {
  // 1. Get order by number
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      placedAt: orders.placedAt,
      shippingAddressSnapshot: orders.shippingAddressSnapshot,
    })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) return null;

  // 2. Verify phone number
  let orderPhone = '';

  if (!orderPhone && order.shippingAddressSnapshot) {
    try {
      const snapshot =
        typeof order.shippingAddressSnapshot === 'string'
          ? JSON.parse(order.shippingAddressSnapshot)
          : order.shippingAddressSnapshot;
      if (snapshot.phone) {
        orderPhone = decrypt(snapshot.phone);
      }
    } catch (e) {}
  }

  // Normalize and compare (only numbers)
  const normalizedInputPhone = phone.replace(/\D/g, '');
  const normalizedOrderPhone = orderPhone.replace(/\D/g, '');

  if (!normalizedOrderPhone || normalizedInputPhone !== normalizedOrderPhone) {
    return null; // Phone doesn't match
  }

  // 3. Get Items
  const items = await db
    .select({
      name: orderItems.productName,
      size: orderItems.size,
      quantity: orderItems.quantity,
      price: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    placedAt: order.placedAt,
    items: items.map((item) => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}
