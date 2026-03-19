import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredPoints } from '@/lib/db/repositories/points';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Cron Job: Dọn dẹp điểm thưởng hết hạn.
 * Tần suất: Chạy hàng ngày (ví dụ: 00:00).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Security: Yêu cầu CRON_SECRET để bảo mật
    if (
      process.env.NODE_ENV === 'production' &&
      (!cronSecret || authHeader !== `Bearer ${cronSecret}`)
    ) {
      return ResponseWrapper.unauthorized('Unauthorized cron target access');
    }

    const count = await cleanupExpiredPoints();

    const result = {
      count,
      timestamp: new Date().toISOString(),
    };

    return ResponseWrapper.success(result, `Đã xử lý hết hạn điểm cho ${count} người dùng.`);
  } catch (error) {
    console.error('Points cleanup cron error:', error);
    return ResponseWrapper.serverError('Points cleanup cron failed', error);
  }
}
