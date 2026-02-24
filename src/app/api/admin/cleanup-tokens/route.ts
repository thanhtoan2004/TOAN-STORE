import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

// DELETE - Cleanup expired and used tokens
/**
 * API Dọn dẹp các mã Token khôi phục mật khẩu (Cleanup).
 * Chức năng: Xóa các token đã hết hạn hoặc đã sử dụng (để lâu hơn 7 ngày) để tối ưu dung lượng DB.
 */
export async function DELETE() {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Delete expired tokens (older than expiry time)
        const expiredResult = await executeQuery(
            'DELETE FROM password_resets WHERE expires_at < UTC_TIMESTAMP()'
        ) as any;

        // Delete used tokens older than 7 days
        const usedResult = await executeQuery(
            'DELETE FROM password_resets WHERE used = 1 AND created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)'
        ) as any;

        const expiredCount = expiredResult.affectedRows || 0;
        const usedCount = usedResult.affectedRows || 0;
        const totalDeleted = expiredCount + usedCount;

        return NextResponse.json({
            success: true,
            message: `Đã xóa ${totalDeleted} token (${expiredCount} expired, ${usedCount} used)`,
            data: {
                expiredDeleted: expiredCount,
                usedDeleted: usedCount,
                totalDeleted
            }
        });
    } catch (error) {
        console.error('Error cleaning up tokens:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Get token statistics
/**
 * API Lấy thống kê về tình trạng Token (Tổng số, Đã dùng, Đang hoạt động).
 */
export async function GET() {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN expires_at < UTC_TIMESTAMP() THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN used = 0 AND expires_at > UTC_TIMESTAMP() THEN 1 ELSE 0 END) as active
      FROM password_resets
    `) as any[];

        return NextResponse.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching token stats:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
