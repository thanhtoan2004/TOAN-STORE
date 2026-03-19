import { NextRequest, NextResponse } from 'next/server';
import { getCustomerNotes, addCustomerNote } from '@/lib/db/repositories/user';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý ghi chú khách hàng (Customer Notes) - Admin.
 * Chức năng:
 * - GET: Lấy danh sách ghi chú nội bộ về một khách hàng cụ thể.
 * - POST: Thêm ghi chú mới của quản trị viên cho khách hàng.
 * Bảo mật: Yêu cầu quyền Admin.
 */

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return ResponseWrapper.error('ID người dùng không hợp lệ', 400);
    }

    const notesData = await getCustomerNotes(userId);

    return ResponseWrapper.success(notesData);
  } catch (error) {
    console.error('Get customer notes error:', error);
    return ResponseWrapper.serverError('Lỗi server khi tải ghi chú khách hàng', error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return ResponseWrapper.error('ID người dùng không hợp lệ', 400);
    }

    const body = await request.json();
    const { note } = body;

    if (!note) {
      return ResponseWrapper.error('Nội dung ghi chú là bắt buộc', 400);
    }

    await addCustomerNote({
      userId,
      adminId: admin.userId,
      note,
    });

    return ResponseWrapper.success(null, 'Đã lưu ghi chú khách hàng thành công');
  } catch (error) {
    console.error('Add customer note error:', error);
    return ResponseWrapper.serverError('Lỗi server khi lưu ghi chú', error);
  }
}
