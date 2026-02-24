import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// POST - Track banner click
/**
 * API Ghi nhận lượt click vào Banner.
 * Dùng để đo lường hiệu quả (CTR) của các chiến dịch quảng cáo.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bannerId } = body;

    if (!bannerId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID banner' },
        { status: 400 }
      );
    }

    // Increment click count
    await executeQuery(
      'UPDATE banners SET click_count = click_count + 1 WHERE id = ?',
      [bannerId]
    );

    return NextResponse.json({
      success: true,
      message: 'Tracked click'
    });
  } catch (error) {
    console.error('Error tracking banner click:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}
