import { redis } from '../redis'; // Relative path since they are in src/lib/redis and src/lib

interface RateLimitConfig {
    limit: number;      // Maximum requests
    window: number;     // Window size in seconds
}

export class RedisRateLimiter {
    /**
     * Check rate limit using Sliding Window algorithm
     * @param key Unique identifier (e.g., IP address or User ID)
     * @param config Rate limit configuration
     * @returns { success: boolean, remaining: number, reset: number }
     */
    static async check(key: string, config: RateLimitConfig = { limit: 60, window: 60 }) {
        if (!redis) {
            console.warn('Redis not available, skipping rate limit check');
            return { success: true, remaining: 1, reset: Date.now() };
        }

        const now = Date.now();
        const windowStart = now - (config.window * 1000);
        const redisKey = `ratelimit:${key}`;

        const pipeline = redis.pipeline();

        // 1. Remove old timestamps (outside current window)
        pipeline.zremrangebyscore(redisKey, 0, windowStart);

        // 2. Add current timestamp
        pipeline.zadd(redisKey, now, now.toString());

        // 3. Count requests in current window
        pipeline.zcard(redisKey);

        // 4. Set expiry for the key (window size + 1s buffer)
        pipeline.expire(redisKey, config.window + 1);

        const results = await pipeline.exec();

        // Results map:
        // [0]: zremrangebyscore result
        // [1]: zadd result
        // [2]: zcard result (count)
        // [3]: expire result

        if (!results) {
            // Fallback if transaction fails
            return { success: true, remaining: 0, reset: now + config.window * 1000 };
        }

        const count = results[2]?.[1] as number;

        const success = count <= config.limit;
        const remaining = Math.max(0, config.limit - count);
        const reset = now + (config.window * 1000);

        return {
            success,
            remaining,
            reset
        };
    }

    /**
     * Create a middleware-friendly response headers object
     */
    static getHeaders(result: { remaining: number; reset: number; limit: number }) {
        return {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString()
        };
    }
}
