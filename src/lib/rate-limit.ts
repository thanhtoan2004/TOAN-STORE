import { RedisRateLimiter } from './redis/rateLimit';

/**
 * Redis-backed rate limiter (Replaces MySQL implementation)
 */
export class RateLimiter {
    private static instances = new Map<string, RateLimiter>();

    constructor(private tag: string) { }

    /**
     * Get or create a rate limiter instance for a specific tag
     */
    static getInstance(tag: string): RateLimiter {
        if (!this.instances.has(tag)) {
            this.instances.set(tag, new RateLimiter(tag));
        }
        return this.instances.get(tag)!;
    }

    /**
     * Check if the request should be rate limited using Redis
     * @param identifier Unique key for the request (e.g., IP address)
     * @param limit Maximum number of requests allowed in the window
     * @param windowMs Time window in milliseconds
     */
    async check(identifier: string, limit: number, windowMs: number): Promise<{
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
    }> {
        // Create a unique key combining tag and identifier
        const key = `${this.tag}:${identifier}`;

        // Convert ms to seconds (ceil to be safe)
        const windowSeconds = Math.ceil(windowMs / 1000);

        try {
            const result = await RedisRateLimiter.check(key, { limit, window: windowSeconds });

            return {
                success: result.success,
                limit: limit,
                remaining: result.remaining,
                reset: result.reset
            };
        } catch (error) {
            console.error('RateLimit Redis Error:', error);
            // Fallback: Allow request if Redis fails (Fail Open)
            return {
                success: true,
                limit,
                remaining: 1,
                reset: Date.now() + windowMs
            };
        }
    }

    /**
     * Prune is handled automatically by Redis TTL, so this is a no-op
     */
    async prune() {
        // No-op for Redis
    }
}
