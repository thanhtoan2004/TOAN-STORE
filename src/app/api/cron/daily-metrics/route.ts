import { NextRequest, NextResponse } from 'next/server';
import { aggregateDailyMetrics } from '@/lib/cron/revenue-aggregation';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Cron Job: Tự động tổng hợp dữ liệu tài chính (Metrics) hàng ngày.
 * Mặc định: Chạy cho ngày hôm trước (yesterday).
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

    // Calculate yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Run aggregation
    const result = await aggregateDailyMetrics(yesterday);

    const resultData = {
      processedDays: result.processedDays,
      targetDate: yesterday.toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    return ResponseWrapper.success(
      resultData,
      `Metrics aggregation completed for ${resultData.targetDate}.`
    );
  } catch (error) {
    console.error('Daily metrics cron error:', error);
    return ResponseWrapper.serverError('Metrics aggregation failed', error);
  }
}
