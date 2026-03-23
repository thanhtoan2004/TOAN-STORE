import { Queue } from 'bullmq';
import redisConfiguration, { getRedis } from '@/lib/redis/redis';

// Define Event Types
export type EventType =
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'order.paid'
  | 'inventory.adjusted'
  | 'user.registered'
  | 'tier.upgraded';

export interface AppEvent<T = any> {
  type: EventType;
  payload: T;
  timestamp: number;
}

class EventBus {
  private queue: Queue;
  private static instance: EventBus;

  private constructor() {
    this.queue = new Queue('app-events', {
      connection: redisConfiguration,
    });
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publish an event to the queue for background processing
   * AND to Redis Pub/Sub for immediate Socket.io broadcasting
   */
  public async publish<T>(type: EventType, payload: T) {
    try {
      const event: AppEvent<T> = {
        type,
        payload,
        timestamp: Date.now(),
      };

      // 1. Async Processing (BullMQ)
      await this.queue.add(type, event, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      });

      // 2. Real-time Broadcasting (Redis Pub/Sub)
      const redis = getRedis();
      if (type.startsWith('order.') || type === 'tier.upgraded') {
        const userId = (payload as any).userId;
        await redis.publish(
          'live-notifications',
          JSON.stringify({
            type,
            userId,
            message: this.getEventMessage(type, payload),
            data: payload,
          })
        );
      } else if (type === 'inventory.adjusted') {
        await redis.publish('stock-updates', JSON.stringify(payload));
      }

      console.log(`📡 Event Published & Broadcasted: ${type}`);
    } catch (error) {
      console.error(`❌ Failed to publish event ${type}:`, error);
    }
  }

  private getEventMessage(type: EventType, payload: any): string {
    switch (type) {
      case 'order.created':
        return `Đơn hàng mới #${payload.orderNumber} đã được tạo.`;
      case 'order.updated':
        return `Đơn hàng #${payload.orderNumber} đã chuyển sang trạng thái ${payload.newStatus}.`;
      case 'tier.upgraded':
        return `Chúc mừng! Bạn đã thăng hạng lên ${payload.newTier}.`;
      default:
        return 'Có thông báo mới từ hệ thống.';
    }
  }
}

export const eventBus = EventBus.getInstance();
