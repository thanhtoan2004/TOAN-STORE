import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredReservations } from '@/lib/inventory/reservation';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Cron Job: Giải phóng tồn kho bị giữ (Inventory Reservations) đã hết hạn.
 * Giúp trả lại số lượng sản phẩm vào kho nếu khách hàng không hoàn tất thanh toán.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Security: ALWAYS require CRON_SECRET — reject if not configured
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return ResponseWrapper.unauthorized('Unauthorized cron target access');
    }

    await cleanupExpiredReservations();

    const result = {
      timestamp: new Date().toISOString(),
    };

    return ResponseWrapper.success(result, 'Cleanup completed');
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return ResponseWrapper.serverError('Cleanup failed', error);
  }
}
