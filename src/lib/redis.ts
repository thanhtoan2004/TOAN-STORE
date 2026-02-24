import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

/**
 * Cấu hình kết nối Redis (Memory Cache Datastore).
 * Redis ở trong dự án này đóng vai trò lõi cho việc:
 * 1. Làm backend caching cho Next.js
 * 2. Lưu trữ token session tạm thời
 * 3. Chạy Background Queue (BullMQ) để gửi Email mà không làm lag server chính.
 */
const redisConfiguration: any = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Critical requirement for BullMQ (Hệ thống hàng đợi)
    // Thuật toán Backoff: Nếu Redis sập, server sẽ tự động kết nối lại chậm dần đều để không làm nghẽn CPU
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

// Áp dụng design pattern Singleton để đảm bảo toàn bộ dự án chỉ xài chung 1 cục Connection duy nhất
let redisInstance: Redis | null = null;

/**
 * Hàm gọi Instance của Redis. Nếu chưa có thì tạo mới, nếu có rồi thì dùng lại bộ nhớ cũ.
 */
export const getRedisConnection = () => {
    if (!redisInstance) {
        console.log(`[SERVICE_INITIALIZATION] Creating singleton Redis connection to ${REDIS_HOST}:${REDIS_PORT}...`);
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

// Export a function to get the instance (standard approach)
export const getRedis = () => getRedisConnection();

// For backward compatibility, but we should be careful with this
// In some environments, top-level execution here still happens if imported
// A better way is to use a proxy or just rely on getRedis()
export const redis = getRedisConnection();

export default redisConfiguration;
