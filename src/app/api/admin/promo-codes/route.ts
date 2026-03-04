import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { invalidateCache } from '@/lib/cache';
import { checkAdminAuth } from '@/lib/auth';

// GET - Lấy danh sách coupons (cho admin)
/**
 * API Lấy danh sách toàn bộ mã giảm giá (Coupons).
 * Hỗ trợ lọc theo trạng thái Đang hoạt động (Active) hoặc Hết hạn.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // M2: Cap limit
    const offset = (page - 1) * limit;
    const isActive = searchParams.get('isActive'); // 'true', 'false', or null for all

    let query = `
      SELECT 
        c.*,
        COUNT(cu.id) as times_used
      FROM coupons c
      LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
      WHERE c.deleted_at IS NULL
    `;
    const params: any[] = [];

    let whereClause = '';

    // Filter by active status if specified
    if (isActive !== null) {
      const now = new Date().toISOString();
      if (isActive === 'true') {
        whereClause =
          ' AND (c.starts_at IS NULL OR c.starts_at <= ?) AND (c.ends_at IS NULL OR c.ends_at >= ?)';
        params.push(now, now);
      } else if (isActive === 'false') {
        whereClause = ' AND (c.starts_at > ? OR c.ends_at < ?)';
        params.push(now, now);
      }
    }

    query += whereClause;
    query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const coupons = await executeQuery<any[]>(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM coupons WHERE deleted_at IS NULL';
    const countParams: any[] = [];

    if (isActive !== null) {
      const now = new Date().toISOString();
      if (isActive === 'true') {
        countQuery +=
          ' AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?)';
        countParams.push(now, now);
      } else if (isActive === 'false') {
        countQuery += ' AND (starts_at > ? OR ends_at < ?)';
        countParams.push(now, now);
      }
    }

    const [countRow] = await executeQuery<any[]>(countQuery, countParams);
    const total = countRow?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        coupons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}

// POST - Tạo coupon mới (admin only)
/**
 * API Tạo mã giảm giá mới.
 * Hỗ trợ nhiều loại: Giảm theo số tiền cố định (Fixed) hoặc Phần trăm (Percent).
 * Có cài đặt hạn mức sử dụng (Usage limit) và hạng thành viên tối thiểu.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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

    // Validate required fields
    if (!code || !discount_type || !discount_value) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!['fixed', 'percent'].includes(discount_type)) {
      return NextResponse.json(
        { success: false, message: 'Loại giảm giá không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate discount value
    if (discount_type === 'percent' && (discount_value < 0 || discount_value > 100)) {
      return NextResponse.json(
        { success: false, message: 'Phần trăm giảm giá phải từ 0-100' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const [existing] = await executeQuery<any[]>(
      'SELECT id FROM coupons WHERE code = ? AND deleted_at IS NULL',
      [code]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Mã giảm giá đã tồn tại' },
        { status: 400 }
      );
    }

    // Insert coupon
    await executeQuery(
      `INSERT INTO coupons 
       (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at, usage_limit, usage_limit_per_user, applicable_tier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        description || '',
        discount_type,
        discount_value,
        min_order_amount || null,
        max_discount_amount || null,
        starts_at || null,
        ends_at || null,
        usage_limit || null,
        usage_limit_per_user || null,
        applicable_tier || 'bronze',
      ]
    );

    // Invalidate cache
    await invalidateCache('promo-codes:available');

    return NextResponse.json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}

// PUT - Cập nhật coupon (admin only)
/**
 * API Cập nhật thông tin mã giảm giá.
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID mã giảm giá' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const allowedFields = [
      'description',
      'discount_type',
      'discount_value',
      'min_order_amount',
      'max_discount_amount',
      'starts_at',
      'ends_at',
      'usage_limit',
      'usage_limit_per_user',
      'applicable_tier',
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không có trường nào để cập nhật' },
        { status: 400 }
      );
    }

    updateValues.push(id);

    await executeQuery(`UPDATE coupons SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    // Invalidate cache
    await invalidateCache('promo-codes:available');

    return NextResponse.json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công',
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}

// DELETE - Xóa coupon (admin only)
/**
 * API Xóa mã giảm giá (Soft Delete).
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID mã giảm giá' },
        { status: 400 }
      );
    }

    // Soft delete
    await executeQuery('UPDATE coupons SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    // Invalidate cache
    await invalidateCache('promo-codes:available');

    return NextResponse.json({
      success: true,
      message: 'Xóa mã giảm giá thành công',
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
