import { NextResponse } from 'next/server';
import { cleanupExpiredReservations } from '@/lib/inventory/reservation';

/**
 * Cron Job: Giải phóng tồn kho bị giữ (Inventory Reservations) đã hết hạn.
 * Giúp trả lại số lượng sản phẩm vào kho nếu khách hàng không hoàn tất thanh toán.
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

        await cleanupExpiredReservations();

        return NextResponse.json({
            success: true,
            message: 'Cleanup completed',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Cleanup cron error:', error);
        return NextResponse.json({
            success: false,
            message: 'Cleanup failed'
        }, { status: 500 });
    }
}
