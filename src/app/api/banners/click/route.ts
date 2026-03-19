import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { banners } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * POST - Track banner click.
 * API Ghi nhận lượt click vào Banner.
 * Dùng để đo lường hiệu quả (CTR) của các chiến dịch quảng cáo.
 * Hoạt động công khai (không yêu cầu đăng nhập) để tracking khách vãng lai.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bannerId } = body;

    if (!bannerId) {
      return ResponseWrapper.error('Thiếu ID banner', 400);
    }

    // Increment click count using Drizzle
    await db
      .update(banners)
      .set({ clickCount: sql`${banners.clickCount} + 1` })
      .where(eq(banners.id, Number(bannerId)));

    return ResponseWrapper.success(null, 'Tracked click');
  } catch (error) {
    console.error('Error tracking banner click:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
