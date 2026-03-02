import { getRedisConnection } from './redis';

const CACHE_PREFIX = 'toan:';
const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Get data from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const redis = getRedisConnection();
        const data = await redis.get(CACHE_PREFIX + key);
        if (!data) return null;
        return JSON.parse(data) as T;
    } catch (error) {
        console.error(`Cache Get Error [${key}]:`, error);
        return null;
    }
}

/**
 * Set data to cache
 */
export async function setCache(key: string, data: any, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
    try {
        const redis = getRedisConnection();
        await redis.set(
            CACHE_PREFIX + key,
            JSON.stringify(data),
            'EX',
            ttlSeconds
        );
    } catch (error) {
        console.error(`Cache Set Error [${key}]:`, error);
    }
}

/**
 * Invalidate specific cache key
 */
export async function invalidateCache(key: string): Promise<void> {
    try {
        const redis = getRedisConnection();
        await redis.del(CACHE_PREFIX + key);
    } catch (error) {
        console.error(`Cache Invalidate Error [${key}]:`, error);
    }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
    try {
        const redis = getRedisConnection();
        const keys = await redis.keys(CACHE_PREFIX + pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.error(`Cache Invalidate Pattern Error [${pattern}]:`, error);
    }
}
