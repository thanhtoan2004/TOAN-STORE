import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { updateRefundStatus, getRefundById } from '@/lib/db/repositories/refund';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy chi tiết yêu cầu hoàn tiền.
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const id = parseInt(params.id);
    const refund = await getRefundById(id);

    if (!refund) {
      return ResponseWrapper.notFound('Không tìm thấy yêu cầu hoàn tiền');
    }

    return ResponseWrapper.success(refund);
  } catch (error: any) {
    console.error('Admin Get Refund Error:', error);
    return ResponseWrapper.serverError(error.message || 'Lỗi khi tải chi tiết hoàn tiền', error);
  }
}

/**
 * API Phê duyệt hoặc Từ chối yêu cầu hoàn tiền.
 * Yêu cầu gửi kèm trạng thái (`approved` hoặc `rejected`) và phản hồi cho khách hàng.
 */
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const { status, response } = body;

    // Validate input
    if (!status || !['approved', 'rejected'].includes(status)) {
      return ResponseWrapper.error(
        'Trạng thái không hợp lệ. Chỉ chấp nhận approved hoặc rejected.',
        400
      );
    }

    const success = await updateRefundStatus(id, status, response || '');

    if (!success) {
      return ResponseWrapper.notFound('Yêu cầu hoàn tiền không tồn tại hoặc cập nhật thất bại');
    }

    return ResponseWrapper.success(null, 'Cập nhật trạng thái hoàn tiền thành công');
  } catch (error: any) {
    console.error('Admin Update Refund Error:', error);
    return ResponseWrapper.serverError(error.message || 'Lỗi khi cập nhật hoàn tiền', error);
  }
}
