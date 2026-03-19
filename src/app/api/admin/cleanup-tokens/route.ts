import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { passwordResets } from '@/lib/db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * API Dọn dẹp các mã Token khôi phục mật khẩu (Cleanup).
 * Chức năng: Xóa các token đã hết hạn hoặc đã sử dụng (để lâu hơn 7 ngày) để tối ưu dung lượng DB.
 */
export async function DELETE() {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Delete expired tokens (older than now)
    const [expiredResult] = await db
      .delete(passwordResets)
      .where(lt(passwordResets.expiresAt, new Date()));

    // Delete used tokens older than 7 days
    const [usedResult] = await db
      .delete(passwordResets)
      .where(
        and(
          eq(passwordResets.used, 1),
          lt(passwordResets.createdAt, sql`DATE_SUB(NOW(), INTERVAL 7 DAY)`)
        )
      );

    const expiredCount = expiredResult.affectedRows || 0;
    const usedCount = usedResult.affectedRows || 0;
    const totalDeleted = expiredCount + usedCount;

    return NextResponse.json({
      success: true,
      message: `Đã xóa ${totalDeleted} token (${expiredCount} expired, ${usedCount} used)`,
      data: {
        expiredDeleted: expiredCount,
        usedDeleted: usedCount,
        totalDeleted,
      },
    });
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * API Lấy thống kê về tình trạng Token (Tổng số, Đã dùng, Đang hoạt động).
 */
export async function GET() {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        used: sql<number>`SUM(CASE WHEN ${passwordResets.used} = 1 THEN 1 ELSE 0 END)`,
        expired: sql<number>`SUM(CASE WHEN ${passwordResets.expiresAt} < NOW() THEN 1 ELSE 0 END)`,
        active: sql<number>`SUM(CASE WHEN ${passwordResets.used} = 0 AND ${passwordResets.expiresAt} > NOW() THEN 1 ELSE 0 END)`,
      })
      .from(passwordResets);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
