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
    const { email, orderNumber, totalAmount } = order;

    // 1. Send Order Confirmation Email
    // We delegate this to the Email Queue to keep workers specialized
    const subject = `Order Confirmation #${orderNumber}`;
    const totalFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount);

    // Simple HTML Template (Can be moved to a template engine later)
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">Thank you for your order!</h1>
        <p>Your order <strong>#${orderNumber}</strong> has been successfully placed.</p>
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

eventWorker.on('completed', (job) => {
    console.log(`Event job ${job.id} (${job.data.type}) completed`);
});

eventWorker.on('failed', (job, err) => {
    console.error(`Event job ${job?.id} failed:`, err);
});
