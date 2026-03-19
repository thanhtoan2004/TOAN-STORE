import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { contactMessages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Cập nhật trạng thái của tin nhắn liên hệ (Ví dụ: Mark as read, In progress, Resolved).
 * Bảo mật: Chỉ dành cho Admin.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return ResponseWrapper.error('Thiếu trạng thái cập nhật', 400);
    }

    const [result] = await db
      .update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id));

    if (result.affectedRows === 0) {
      return ResponseWrapper.notFound('Không tìm thấy tin nhắn liên hệ');
    }

    return ResponseWrapper.success(null, 'Cập nhật trạng thái tin nhắn thành công');
  } catch (error) {
    console.error('Error updating contact:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
