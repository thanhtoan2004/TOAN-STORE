import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { coupons as couponsTable, couponUsage } from '@/lib/db/schema';
import { eq, and, sql, desc, count, isNull, or, lte, gte, lt, gt } from 'drizzle-orm';
import { invalidateCache } from '@/lib/redis/cache';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET - Lấy danh sách coupons (cho admin).
 * Chức năng:
 * - Hỗ trợ lọc theo trạng thái hoạt động (isActive = true/false).
 * - Phân trang (Pagination) và giới hạn số lượng trả về (Max 100).
 * - Tự động tính toán số lần đã sử dụng (times_used) cho từng mã.
 * Bảo mật: Yêu cầu quyền Admin.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const isActiveParam = searchParams.get('isActive'); // 'true', 'false', or null for all

    const now = new Date();
    const filters = [isNull(couponsTable.deletedAt)];

    if (isActiveParam === 'true') {
      filters.push(or(isNull(couponsTable.startsAt), lte(couponsTable.startsAt, now))!);
      filters.push(or(isNull(couponsTable.endsAt), gte(couponsTable.endsAt, now))!);
    } else if (isActiveParam === 'false') {
      filters.push(
        or(
          and(sql`${couponsTable.startsAt} IS NOT NULL`, gt(couponsTable.startsAt, now))!,
          and(sql`${couponsTable.endsAt} IS NOT NULL`, lt(couponsTable.endsAt, now))!
        )!
      );
    }

    // 1. Get coupons with usage count
    const coupons = await db
      .select({
        id: couponsTable.id,
        code: couponsTable.code,
        description: couponsTable.description,
        discount_type: couponsTable.discountType,
        discount_value: couponsTable.discountValue,
        min_order_amount: couponsTable.minOrderAmount,
        max_discount_amount: couponsTable.maxDiscountAmount,
        starts_at: couponsTable.startsAt,
        ends_at: couponsTable.endsAt,
        usage_limit: couponsTable.usageLimit,
        usage_limit_per_user: couponsTable.usageLimitPerUser,
        applicable_tier: couponsTable.applicableTier,
        created_at: couponsTable.createdAt,
        updated_at: couponsTable.updatedAt,
        times_used: count(couponUsage.id),
      })
      .from(couponsTable)
      .leftJoin(couponUsage, eq(couponsTable.id, couponUsage.couponId))
      .where(and(...filters))
      .groupBy(couponsTable.id)
      .orderBy(desc(couponsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // 2. Get total count
    const [countResult] = await db
      .select({ total: count() })
      .from(couponsTable)
      .where(and(...filters));

    const total = countResult?.total || 0;

    const result = {
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ResponseWrapper.success(result);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * POST - Tạo coupon mới (admin only).
 * Quy trình:
 * 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào (Code, Type, Value).
 * 2. Kiểm tra trùng mã (Case-insensitive check cho bản ghi chưa xóa).
 * 3. Chèn dữ liệu mới vào DB.
 * 4. Xóa cache Redis để mã mới có hiệu lực ngay lập tức.
 * 5. Ghi log Audit.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      starts_at,
      ends_at,
      usage_limit,
      usage_limit_per_user,
      applicable_tier,
    } = body;

    if (!code || !discount_type || !discount_value) {
      return ResponseWrapper.error(
        'Thiếu thông tin bắt buộc (code, discount_type, discount_value)',
        400
      );
    }

    if (!['fixed', 'percent'].includes(discount_type)) {
      return ResponseWrapper.error('Loại giảm giá không hợp lệ (fixed hoặc percent)', 400);
    }

    if (discount_type === 'percent' && (discount_value < 0 || discount_value > 100)) {
      return ResponseWrapper.error('Phần trăm giảm giá phải từ 0-100', 400);
    }

    const [existing] = await db
      .select({ id: couponsTable.id })
      .from(couponsTable)
      .where(and(eq(couponsTable.code, code.toUpperCase()), isNull(couponsTable.deletedAt)))
      .limit(1);

    if (existing) {
      return ResponseWrapper.error('Mã giảm giá đã tồn tại', 400);
    }

    await db.insert(couponsTable).values({
      code: code.toUpperCase(),
      description: description || null,
      discountType: discount_type,
      discountValue: String(discount_value),
      minOrderAmount: min_order_amount ? String(min_order_amount) : null,
      maxDiscountAmount: max_discount_amount ? String(max_discount_amount) : null,
      startsAt: starts_at ? new Date(starts_at) : null,
      endsAt: ends_at ? new Date(ends_at) : null,
      usageLimit: usage_limit || null,
      usageLimitPerUser: usage_limit_per_user || null,
      applicableTier: applicable_tier || 'bronze',
    });

    await invalidateCache('promo-codes:available');

    await logAdminAction(
      admin.userId,
      'CREATE_COUPON',
      'coupons',
      0,
      null,
      { code, discount_type, discount_value },
      request
    );

    return ResponseWrapper.success(null, 'Tạo mã giảm giá thành công');
  } catch (error) {
    console.error('Error creating coupon:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * PUT - Cập nhật coupon (admin only).
 * Hỗ trợ cập nhật các trường cụ thể dựa trên ID truyền vào Body.
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return ResponseWrapper.error('Thiếu ID mã giảm giá', 400);
    }

    const setClause: any = {};
    if (updates.description !== undefined) setClause.description = updates.description;
    if (updates.discount_type !== undefined) setClause.discountType = updates.discount_type;
    if (updates.discount_value !== undefined)
      setClause.discountValue = String(updates.discount_value);
    if (updates.min_order_amount !== undefined)
      setClause.minOrderAmount = updates.min_order_amount ? String(updates.min_order_amount) : null;
    if (updates.max_discount_amount !== undefined)
      setClause.maxDiscountAmount = updates.max_discount_amount
        ? String(updates.max_discount_amount)
        : null;
    if (updates.starts_at !== undefined)
      setClause.startsAt = updates.starts_at ? new Date(updates.starts_at) : null;
    if (updates.ends_at !== undefined)
      setClause.endsAt = updates.ends_at ? new Date(updates.ends_at) : null;
    if (updates.usage_limit !== undefined) setClause.usageLimit = updates.usage_limit;
    if (updates.usage_limit_per_user !== undefined)
      setClause.usageLimitPerUser = updates.usage_limit_per_user;
    if (updates.applicable_tier !== undefined) setClause.applicableTier = updates.applicable_tier;

    if (Object.keys(setClause).length === 0) {
      return ResponseWrapper.error('Không có trường nào để cập nhật', 400);
    }

    setClause.updatedAt = new Date();

    await db
      .update(couponsTable)
      .set(setClause)
      .where(eq(couponsTable.id, Number(id)));

    await invalidateCache('promo-codes:available');

    await logAdminAction(
      admin.userId,
      'UPDATE_COUPON',
      'coupons',
      Number(id),
      null,
      setClause,
      request
    );

    return ResponseWrapper.success(null, 'Cập nhật mã giảm giá thành công');
  } catch (error) {
    console.error('Error updating coupon:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * DELETE - Xóa coupon (admin only).
 * Sử dụng Soft Delete bằng cách đánh dấu `deletedAt`.
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ResponseWrapper.error('Thiếu ID mã giảm giá', 400);
    }

    await db
      .update(couponsTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(couponsTable.id, Number(id)));

    await invalidateCache('promo-codes:available');

    await logAdminAction(
      admin.userId,
      'DELETE_COUPON',
      'coupons',
      Number(id),
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
