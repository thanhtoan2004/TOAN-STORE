import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { getBulkDiscounts, createBulkDiscount } from '@/lib/db/repositories/bulkDiscount';
import { ResponseWrapper } from '@/lib/api/api-response';
import { invalidateCachePattern } from '@/lib/redis/cache';

/**
 * API Quản lý giảm giá theo số lượng (Bulk Discounts).
 * Chức năng:
 * - GET: Liệt kê các chương trình giảm giá bán sỉ hiện có.
 * - POST: Tạo mới chính sách giảm giá bán sỉ cho sản phẩm.
 * Bảo mật: Yêu cầu quyền Admin.
 */

export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const discounts = await getBulkDiscounts();
    return ResponseWrapper.success(discounts);
  } catch (error: any) {
    console.error('Bulk Discounts GET error:', error);
    return ResponseWrapper.serverError(error.message || 'Lỗi khi tải danh sách giảm giá sỉ', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await req.json();

    if (!body.name || !body.discountPercentage || !body.startTime || !body.endTime) {
      return ResponseWrapper.error(
        'Thiếu thông tin bắt buộc (name, discountPercentage, startTime, endTime)',
        400
      );
    }

    const id = await createBulkDiscount(body);

    // Xóa cache để khách hàng thấy giá mới ngay lập tức
    await invalidateCachePattern('products:list:*');
    await invalidateCachePattern('product:v3:detail:*');

    const result = { id };

    return ResponseWrapper.success(result, 'Đã tạo chương trình giảm giá sỉ thành công');
  } catch (error: any) {
    console.error('Bulk Discounts POST error:', error);
    return ResponseWrapper.serverError(error.message || 'Lỗi khi tạo giảm giá sỉ', error);
  }
}
