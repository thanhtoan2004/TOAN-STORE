import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const redisConfiguration: any = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Critical for BullMQ
    retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError(err: Error) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    }
};

// Singleton Redis instance
let redisInstance: Redis | null = null;

export const getRedisConnection = () => {
    if (!redisInstance) {
        redisInstance = new Redis(redisConfiguration);

        redisInstance.on('error', (err) => {
            // Chỉ log lỗi một lần mỗi 10 giây để tránh làm ngập log
            if (!(global as any)._lastRedisError || Date.now() - (global as any)._lastRedisError > 10000) {
                console.error('Redis Connection Error (Check if Redis is running):', err.message);
                (global as any)._lastRedisError = Date.now();
            }
        });

        redisInstance.on('connect', () => {
            console.log(`Successfully connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
        });
    }
    return redisInstance;
};

// Export singleton instance for direct usage
export const redis = getRedisConnection();

export default redisConfiguration;
