import { db } from '../drizzle';
import { ipBlocklist } from '../schema';
import { eq, sql, gt } from 'drizzle-orm';

/**
 * Repository quản lý danh sách IP bị chặn.
 * Dùng để ngăn chặn brute-force, DDoS và các hoạt động nghi vấn.
 */
export const IpBlocklistRepository = {
  /**
   * Kiểm tra xem một IP có đang bị chặn hay không
   */
  async isBlocked(ip: string): Promise<boolean> {
    const [record] = await db
      .select()
      .from(ipBlocklist)
      .where(eq(ipBlocklist.ipAddress, ip))
      .limit(1);

    if (!record) return false;

    // Kiểm tra xem đã hết hạn chặn chưa
    if (record.blockedUntil && record.blockedUntil < new Date()) {
      // Tự động gỡ chặn nếu đã hết hạn
      await this.unblockIp(ip);
      return false;
    }

    return true;
  },

  /**
   * Thêm IP vào danh sách chặn
   */
  async blockIp(ip: string, reason: string, durationMinutes: number = 60) {
    const blockedUntil = new Date(Date.now() + durationMinutes * 60000);

    return db
      .insert(ipBlocklist)
      .values({
        ipAddress: ip,
        reason,
        blockedUntil,
        isPermanent: durationMinutes > 525600 ? 1 : 0, // > 1 year
      })
      .onDuplicateKeyUpdate({
        set: {
          reason,
          blockedUntil,
          createdAt: sql`CURRENT_TIMESTAMP`,
        },
      });
  },

  /**
   * Gỡ chặn IP
   */
  async unblockIp(ip: string) {
    return db.delete(ipBlocklist).where(eq(ipBlocklist.ipAddress, ip));
  },
};
