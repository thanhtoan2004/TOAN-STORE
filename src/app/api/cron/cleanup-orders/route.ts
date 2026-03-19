import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredOrders } from '@/lib/db/repositories/order';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Cron Job: Tự động dọn dẹp và hủy các đơn hàng quá hạn thanh toán.
 * Mặc định: Hủy các đơn hàng 'pending' không có phản hồi sau 30 phút.
 * Bảo mật: Yêu cầu CRON_SECRET để thực thi.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Security: ALWAYS require CRON_SECRET — reject if not configured
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return ResponseWrapper.unauthorized('Unauthorized cron target access');
    }

    // Run cleanup (default 30 minutes)
    const cleanedCount = await cleanupExpiredOrders(30);

    const result = {
      cleanedCount,
      timestamp: new Date().toISOString(),
    };

    return ResponseWrapper.success(
      result,
      `Cleanup completed successfully. Cancelled ${cleanedCount} expired orders.`
    );
  } catch (error) {
    console.error('Cleanup orders cron error:', error);
    return ResponseWrapper.serverError('Cleanup failed', error);
  }
}
