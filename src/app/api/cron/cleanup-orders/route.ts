import { NextResponse } from 'next/server';
import { cleanupExpiredOrders } from '@/lib/db/repositories/order';

/**
 * Cron Job: Tự động dọn dẹp và hủy các đơn hàng quá hạn thanh toán.
 * Mặc định: Hủy các đơn hàng 'pending' không có phản hồi sau 30 phút.
 * Bảo mật: Yêu cầu CRON_SECRET để thực thi.
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Security: ALWAYS require CRON_SECRET — reject if not configured
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Run cleanup (default 30 minutes)
        const cleanedCount = await cleanupExpiredOrders(30);

        return NextResponse.json({
            success: true,
            message: `Cleanup completed successfully. Cancelled ${cleanedCount} expired orders.`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Cleanup orders cron error:', error);
        return NextResponse.json({
            success: false,
            message: 'Cleanup failed'
        }, { status: 500 });
    }
}
