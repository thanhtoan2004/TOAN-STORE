import { RedisRateLimiter } from './redis/rateLimit';

/**
 * Rate Limiter (Hệ thống chống DDoS/Spam API) được thiết kế chạy trên RAM của Redis.
 * Cực kỳ quan trọng để bảo vệ các Endpoints nhạy cảm (Đăng nhập, Quên mật khẩu, Thanh toán)
 * khỏi việc bị Bot tấn công dò Pass hoặc đẩy hàng ngàn Request làm sập Server.
 */
export class RateLimiter {
  private static instances = new Map<string, RateLimiter>();

  constructor(private tag: string) {}

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
  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{
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
        reset: result.reset,
      };
    } catch (error) {
      console.error('RateLimit Redis Error:', error);

      /**
       * Enterprise Hardening: Cơ chế Fail-Closed cho các Module Tử Huyệt
       * Bất cứ sự cố sập Redis nào cũng lập tức CHẶN CỨNG các hoạt động nhảy cảm (đăng nhập, thẻ).
       * Thà sập app còn hơn bị Bot càn quét lấy sạch Data trong lúc Rate Limit ngừng hoạt động.
       */
      const criticalTags = ['auth', 'admin', 'payment'];
      if (criticalTags.includes(this.tag)) {
        return {
          success: false, // Block request if we can't verify rate limit
          limit,
          remaining: 0,
          reset: Date.now() + 60000, // Retry in 1 minute
        };
      }

      /**
       * Fallback: Cơ chế Fail-Open cho tính năng Thường.
       * Nếu Redis sập, cho phép thả trôi (không chặn) các API đọc báo, xem hàng...
       * Để người thật vẫn mua sắm được bình thường thay vì lỗi trắng trang.
       */
      return {
        success: true,
        limit,
        remaining: 1,
        reset: Date.now() + windowMs,
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
