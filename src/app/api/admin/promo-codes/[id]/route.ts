import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { coupons as couponsTable } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { invalidateCache } from '@/lib/redis/cache';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * PUT - Cập nhật mã giảm giá (Partial Update).
 * Quy trình:
 * 1. Xác thực quyền Admin.
 * 2. Map dữ liệu từ Request (Snake case) sang Database (Camel case).
 * 3. Cập nhật bản ghi trong Database.
 * 4. Xóa Cache Redis liên quan để đảm bảo tính nhất quán.
 * 5. Ghi log Audit cho hành động quản trị.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: paramId } = await params;
    const id = Number(paramId);

    const body = await request.json();
    const updateData: any = {};

    const fieldMap: Record<string, string> = {
      description: 'description',
      discount_type: 'discountType',
      discount_value: 'discountValue',
      min_order_amount: 'minOrderAmount',
      max_discount_amount: 'maxDiscountAmount',
      starts_at: 'startsAt',
      ends_at: 'endsAt',
      usage_limit: 'usageLimit',
      usage_limit_per_user: 'usageLimitPerUser',
    };

    Object.keys(body).forEach((key) => {
      if (fieldMap[key]) {
        updateData[fieldMap[key]] = body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return ResponseWrapper.error('Không có trường nào để cập nhật', 400);
    }

    await db.update(couponsTable).set(updateData).where(eq(couponsTable.id, id));

    await invalidateCache('promo-codes:available');

    await logAdminAction(admin.userId, 'UPDATE_COUPON', 'coupons', id, null, updateData, request);

    return ResponseWrapper.success(null, 'Cập nhật mã giảm giá thành công');
  } catch (error) {
    console.error('Error updating coupon:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * DELETE - Xóa mã giảm giá (Soft Delete).
 * Bảo mật: Yêu cầu quyền Admin.
 * Tác dụng:
 * - Đánh dấu `deletedAt` cho coupon thay vì xóa vật lý.
 * - Invalidate cache để loại bỏ mã khỏi UI người dùng ngay lập tức.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: paramId } = await params;
    const id = Number(paramId);

    await db.update(couponsTable).set({ deletedAt: new Date() }).where(eq(couponsTable.id, id));

    await invalidateCache('promo-codes:available');

    await logAdminAction(
      admin.userId,
      'DELETE_COUPON',
      'coupons',
      id,
      null,
      { deleted: true },
      request
    );

    return ResponseWrapper.success(null, 'Xóa mã giảm giá thành công');
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
