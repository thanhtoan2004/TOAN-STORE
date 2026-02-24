import { Worker, Job } from 'bullmq';
import redisConfiguration from '@/lib/redis';
import { AppEvent } from '@/lib/events/eventBus';
import { emailQueue } from '@/lib/queue';
import { formatCurrency } from '@/lib/date-utils';

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
    const { email, orderNumber, totalAmount, shippingAddress } = order;
    const customerName = shippingAddress?.name || 'Quý khách';

    // 1. Send Order Confirmation Email
    // We delegate this to the Email Queue to keep workers specialized
    const subject = `Order Confirmation #${orderNumber}`;
    const totalFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount);

    // Simple HTML Template (Can be moved to a template engine later)
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #111; color: #fff; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Cảm ơn bạn!</h1>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #111; font-size: 20px; margin-top: 0;">Xin chào ${customerName},</h2>
            <p>Đơn hàng <strong>#${orderNumber}</strong> của bạn đã được đặt thành công.</p>
        <p style="font-size: 18px;">Total: <strong>${totalFormatted}</strong></p>
        <p>We will notify you when your order is shipped.</p>
        <div style="margin-top: 20px;">
           <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders" style="background-color: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Order</a>
        </div>
      </div>
    `;

    await emailQueue.add('order-confirmation', {
        to: email,
        subject,
        html
    });

    console.log(`✅ [OrderCreated] Email job queued for Order #${orderNumber}`);

    // 2. (Optional) Update Inventory Stats, Analytics, etc.
}

async function handleOrderUpdated(payload: any) {
    const { orderId, orderNumber, newStatus } = payload;
    console.log(`🔄 Processing Order Update: ${orderNumber} -> ${newStatus}`);

    if (newStatus === 'shipped') {
        // Fetch order to get email
        const { getOrderById } = await import('@/lib/db/repositories/order');
        const order = await getOrderById(orderId);

        if (order && order.email) {
            const { sendOrderShippedEmail } = await import('@/lib/mail');
            await sendOrderShippedEmail(order.email, order.customer_name || 'bạn', orderNumber);
            console.log(`✅ [OrderShipped] Email sent to ${order.email} for order ${orderNumber}`);
        } else {
            console.warn(`⚠️ Could not find order or email for order ${orderId}`);
        }
    }
}

async function handleTierUpgraded(payload: any) {
    const { userId, email, fullName, oldTier, newTier, totalPoints } = payload;
    console.log(`⭐ Processing Tier Upgrade for User ${userId}: ${oldTier} -> ${newTier}`);

    if (email && fullName) {
        const { sendTierUpgradeEmail } = await import('@/lib/mail');
        await sendTierUpgradeEmail(email, fullName, newTier, oldTier, totalPoints);
        console.log(`✅ [TierUpgraded] Email sent to ${email} for new tier ${newTier}`);
    } else {
        console.warn(`⚠️ Could not send Tier Upgrade email. Missing email or fullName for User ${userId}`);
    }
}

eventWorker.on('completed', (job) => {
    console.log(`Event job ${job.id} (${job.data.type}) completed`);
});

eventWorker.on('failed', (job, err) => {
    console.error(`Event job ${job?.id} failed:`, err);
});
