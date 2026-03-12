import { Worker, Job } from 'bullmq';
import redisConfiguration from './redis';
import { sendEmail } from './mail';
import { EmailJobData } from './queue';
import '@/workers/eventWorker'; // Import to start the Event Worker

/**
 * Worker to process email jobs
 */
export const emailWorker = new Worker<EmailJobData>(
  'email-queue',
  async (job: Job<EmailJobData>) => {
    const { to, subject, html } = job.data;
    console.log(`Processing email job ${job.id} for ${to}`);

    const success = await sendEmail({ to, subject, html: html || '' });

    if (!success) {
      throw new Error(`Failed to send email to ${to}`);
    }

    return { success: true };
  },
  {
    connection: redisConfiguration,
    concurrency: 5, // Process up to 5 emails in parallel
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`Email job ${job?.id} failed with error: ${err.message}`);
});

console.log('Email Worker started and listening...');
