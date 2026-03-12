import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * API Phản hồi (Admin Reply) cho các đánh giá sản phẩm từ khách hàng.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const reviewId = id;
    const body = await request.json();
    const { admin_reply } = body;

    if (!admin_reply) {
      return NextResponse.json(
        { success: false, message: 'Thiếu nội dung trả lời' },
        { status: 400 }
      );
    }

    await executeQuery('UPDATE product_reviews SET admin_reply = ? WHERE id = ?', [
      admin_reply,
      reviewId,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Trả lời review thành công',
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
