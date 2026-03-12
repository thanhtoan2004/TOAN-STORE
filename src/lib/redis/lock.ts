import { redis } from '@/lib/redis/redis'; // Using alias directly to src/lib/redis.ts

/**
 * Redis Distributed Lock (Simple Redlock Implementation)
 * Used to prevent race conditions during critical operations (e.g., Flash Sale stock deduction)
 */
export class RedisLock {
  /**
   * Acquire a lock
   * @param resource Unique resource identifier (e.g., "product:123")
   * @param ttl Time to live in milliseconds (default 5000ms)
   * @returns Lock ID if acquired, null if failed
   */
  static async acquire(resource: string, ttl: number = 5000): Promise<string | null> {
    if (!redis) {
      console.warn('Redis not available, cannot acquire lock');
      return null; // Fail safe: logic should decide whether to block or proceed
    }

    const key = `lock:${resource}`;
    const val = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // SET key val NX PX ttl
    // NX: Only set if not exists
    // PX: Expire in ttl milliseconds
    const result = await redis.set(key, val, 'PX', ttl, 'NX');

    if (result === 'OK') {
      return val;
    }

    return null;
  }

  /**
   * Release a lock
   * @param resource Unique resource identifier
   * @param val The Lock ID returned by acquire
   */
  static async release(resource: string, val: string): Promise<boolean> {
    if (!redis) return false;

    const key = `lock:${resource}`;

    // Lua script to safely delete the lock only if the value matches
    // This prevents deleting a lock that was already expired and re-acquired by someone else
    const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;

    try {
      const result = await redis.eval(script, 1, key, val);
      return result === 1;
    } catch (error) {
      console.error('Redis Lock Release Error:', error);
      return false;
    }
  }
}
