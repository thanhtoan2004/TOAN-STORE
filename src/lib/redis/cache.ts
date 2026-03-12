import { getRedisConnection } from './redis';

/**
 * Tiện ích quản lý bộ nhớ đệm (Cache) sử dụng Redis.
 * Giúp tăng tốc độ phản hồi API bằng cách lưu trữ kết quả truy vấn đắt đỏ.
 */

const CACHE_PREFIX = 'toan:';
const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Lấy dữ liệu từ Cache.
 * Trả về `null` nếu không tìm thấy hoặc có lỗi parse JSON.
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
 * Lưu dữ liệu vào Cache với thời gian sống (TTL) mặc định là 1 giờ.
 */
export async function setCache(
  key: string,
  data: any,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  try {
    const redis = getRedisConnection();
    await redis.set(CACHE_PREFIX + key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (error) {
    console.error(`Cache Set Error [${key}]:`, error);
  }
}

/**
 * Xóa một khóa cụ thể khỏi Cache (Thường gọi sau khi Database có sự thay đổi).
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
 * Xóa Cache theo mẫu (Pattern).
 * Ví dụ: 'products:*' sẽ xóa toàn bộ cache liên quan đến sản phẩm.
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
