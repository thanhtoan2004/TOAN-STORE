import { Queue, QueueOptions } from 'bullmq';
import redisConfiguration from '../redis/redis';

const defaultOptions: QueueOptions = {
  connection: redisConfiguration,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

/**
 * Interface for Email Job data
 */
export interface EmailJobData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateName?: string;
  templateData?: any;
}

// Initialize individual queues
export const emailQueue = new Queue<EmailJobData>('email-queue', defaultOptions);
export const paymentQueue = new Queue<any>('payment-queue', defaultOptions);

console.log('Queues initialized: email-queue, payment-queue');
