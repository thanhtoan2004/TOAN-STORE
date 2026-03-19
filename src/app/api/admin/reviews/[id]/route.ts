import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productReviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Phản hồi (Admin Reply) cho các đánh giá sản phẩm từ khách hàng.
 * Bảo mật: Yêu cầu quyền Admin.
 * Chức năng:
 * - Cập nhật nội dung phản hồi của quản trị viên (adminReply) cho một review cụ thể.
 * - Tự động ghi log Audit để theo dõi hoạt động của nhân viên hỗ trợ.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: idStr } = await params;
    const reviewId = Number(idStr);
    const body = await request.json();
    const { admin_reply } = body;

    if (!admin_reply) {
      return ResponseWrapper.error('Thiếu nội dung trả lời (admin_reply)', 400);
    }

    const [result] = await db
      .update(productReviews)
      .set({
        adminReply: admin_reply,
        updatedAt: new Date(),
      })
      .where(eq(productReviews.id, reviewId));

    if (result.affectedRows === 0) {
      return ResponseWrapper.notFound('Không tìm thấy bản ghi đánh giá sản phẩm');
    }

    // Log Admin Action
    await logAdminAction(
      admin.userId,
      'REPLY_REVIEW',
      'product_reviews',
      reviewId,
      null,
      { admin_reply },
      request
    );

    return ResponseWrapper.success(null, 'Trả lời review thành công');
  } catch (error) {
    console.error('Error adding reply:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
