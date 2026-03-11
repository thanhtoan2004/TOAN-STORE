import { NextResponse } from 'next/server';
import { aggregateDailyMetrics } from '@/lib/cron/revenue-aggregation';

/**
 * Cron Job: Tự động tổng hợp dữ liệu tài chính (Metrics) hàng ngày.
 * Mặc định: Chạy cho ngày hôm trước (yesterday).
 * Bảo mật: Yêu cầu CRON_SECRET để thực thi.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Security: ALWAYS require CRON_SECRET — reject if not configured
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Calculate yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Run aggregation
    const result = await aggregateDailyMetrics(yesterday);

    return NextResponse.json({
      success: true,
      message: `Metrics aggregation completed for ${yesterday.toISOString().split('T')[0]}.`,
      processedDays: result.processedDays,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Daily metrics cron error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Metrics aggregation failed',
      },
      { status: 500 }
    );
  }
}
