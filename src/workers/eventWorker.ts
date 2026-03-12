import { Worker, Job } from 'bullmq';
import redisConfiguration from '@/lib/redis/redis';
import { AppEvent } from '@/lib/events/eventBus';
import { emailQueue } from '@/lib/queues/queue';
import { formatCurrency } from '@/lib/utils/date-utils';

/**
 * Worker to process application events
 */
export const eventWorker = new Worker<AppEvent>(
  'app-events',
  async (job: Job<AppEvent>) => {
    const { type, payload, timestamp } = job.data;
    console.log(`📡 Processing Event: ${type}`, payload);

    switch (type) {
      case 'order.created':
        await handleOrderCreated(payload);
        break;
      case 'order.updated':
        await handleOrderUpdated(payload);
        break;
      case 'tier.upgraded':
        await handleTierUpgraded(payload);
        break;
      // Add other event handlers here
      default:
        console.warn(`Unknown event type: ${type}`);
    }

    return { success: true };
  },
  {
    connection: redisConfiguration,
    concurrency: 5,
  }
);

// Event Handlers

async function handleOrderCreated(order: any) {
  const { email, orderNumber, totalAmount, shippingAddress, items, subtotal, shipping, tax } =
    order;
  const customerName = shippingAddress?.name || shippingAddress?.fullName || 'Quý khách';

  // 1. Send Order Confirmation Email
  const { sendOrderConfirmationEmail } = await import('@/lib/mail/email-templates');

  // Convert to OrderDetails format expected by the template
  const details = {
    orderNumber,
    customerName,
    customerEmail: email,
    items: items.map((item: any) => ({
      name: item.productName || item.name,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
    })),
    subtotal: subtotal || totalAmount,
    shipping: shipping || 0,
    tax: tax || 0,
    total: totalAmount,
    shippingAddress:
      typeof shippingAddress === 'object'
        ? shippingAddress
        : { fullName: customerName, address: '', phone: '', city: '', district: '', ward: '' },
  };

  // Note: We bypass emailQueue here for simplicity, or we can use emailQueue if we extract HTML generation.
  // Given the worker is already async, calling sendEmail directly is fine.
  await sendOrderConfirmationEmail(details);

  console.log(`✅ [OrderCreated] Confirmation Email sent for Order #${orderNumber}`);

  // 2. (Optional) Update Inventory Stats, Analytics, etc.
}

async function handleOrderUpdated(payload: any) {
  const { orderId, orderNumber, newStatus } = payload;
  console.log(`🔄 Processing Order Update: ${orderNumber} -> ${newStatus}`);

  if (newStatus === 'shipped') {
    const { getOrderById } = await import('@/lib/db/repositories/order');
    const order = await getOrderById(orderId);

    if (order && order.email) {
      const { sendShippingNotificationEmail } = await import('@/lib/mail/email-templates');
      await sendShippingNotificationEmail(
        order.email,
        order.customer_name || 'bạn',
        orderNumber,
        'Chưa có',
        'Giao hàng Tiêu chuẩn'
      );
      console.log(
        `✅ [OrderShipped] Shipping Email sent to ${order.email} for order ${orderNumber}`
      );
    } else {
      console.warn(`⚠️ Could not find order or email for order ${orderId}`);
    }
  } else if (newStatus === 'delivered') {
    const { getOrderById } = await import('@/lib/db/repositories/order');
    const order = await getOrderById(orderId);

    if (order && order.email) {
      const { sendDeliveryConfirmationEmail } = await import('@/lib/mail/email-templates');
      await sendDeliveryConfirmationEmail(order.email, order.customer_name || 'bạn', orderNumber);
      console.log(
        `✅ [OrderDelivered] Delivery Email sent to ${order.email} for order ${orderNumber}`
      );
    }
  } else if (newStatus === 'cancelled') {
    const { getOrderById } = await import('@/lib/db/repositories/order');
    const order = await getOrderById(orderId);

    if (order && order.email) {
      const { sendOrderCancelledEmail } = await import('@/lib/mail/email-templates');
      await sendOrderCancelledEmail(order.email, order.customer_name || 'bạn', orderNumber);
      console.log(
        `✅ [OrderCancelled] Cancellation Email sent to ${order.email} for order ${orderNumber}`
      );
    }
  }
}

async function handleTierUpgraded(payload: any) {
  const { userId, email, fullName, oldTier, newTier, totalPoints } = payload;
  console.log(`⭐ Processing Tier Upgrade for User ${userId}: ${oldTier} -> ${newTier}`);

  if (email && fullName) {
    const { sendTierUpgradeEmail } = await import('@/lib/mail/mail');
    await sendTierUpgradeEmail(email, fullName, newTier, oldTier, totalPoints);
    console.log(`✅ [TierUpgraded] Email sent to ${email} for new tier ${newTier}`);
  } else {
    console.warn(
      `⚠️ Could not send Tier Upgrade email. Missing email or fullName for User ${userId}`
    );
  }
}

eventWorker.on('completed', (job) => {
  console.log(`Event job ${job.id} (${job.data.type}) completed`);
});

eventWorker.on('failed', (job, err) => {
  console.error(`Event job ${job?.id} failed:`, err);
});
