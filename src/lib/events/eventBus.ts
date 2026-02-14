import { Queue } from 'bullmq';
import redisConfiguration from '@/lib/redis'; // Import default config

// Define Event Types
export type EventType =
    | 'order.created'
    | 'order.updated'
    | 'order.cancelled'
    | 'order.paid'
    | 'inventory.adjusted'
    | 'user.registered';

export interface AppEvent<T = any> {
    type: EventType;
    payload: T;
    timestamp: number;
}

class EventBus {
    private queue: Queue;
    private static instance: EventBus;

    private constructor() {
        // Reuse existing Redis connection or create new
        this.queue = new Queue('app-events', {
            connection: redisConfiguration
        });
    }

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Publish an event to the queue
     */
    public async publish<T>(type: EventType, payload: T) {
        try {
            const event: AppEvent<T> = {
                type,
                payload,
                timestamp: Date.now()
            };

            // Job name = Event Type
            await this.queue.add(type, event, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
                removeOnComplete: true,
                removeOnFail: 100 // Keep last 100 failed events for inspection
            });

            console.log(`📡 Event Published: ${type}`);
        } catch (error) {
            console.error(`❌ Failed to publish event ${type}:`, error);
            // In a real system, we might want to fallback to DB log or file log
        }
    }
}

export const eventBus = EventBus.getInstance();
