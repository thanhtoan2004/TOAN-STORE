import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

async function checkAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1];
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const result = await executeQuery('SELECT is_admin FROM users WHERE id = ?', [decoded.userId]) as any[];
    return result.length > 0 && (result[0] as any).is_admin === 1 ? result[0] : null;
  } catch {
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth(request);
    const couponId = params.id;
    const body = await request.json();
    const { code, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at, usage_limit, usage_limit_per_user } = body;

    // Validate required fields
    if (!discount_type || !discount_value) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Build update query
    const updates = [];
    const values: any[] = [];

    if (code !== undefined) {
      updates.push('code = ?');
      values.push(code.toUpperCase());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (discount_type !== undefined) {
      updates.push('discount_type = ?');
      values.push(discount_type);
    }
    if (discount_value !== undefined) {
      updates.push('discount_value = ?');
      values.push(discount_value);
    }
    if (min_order_amount !== undefined) {
      updates.push('min_order_amount = ?');
      values.push(min_order_amount);
    }
    if (max_discount_amount !== undefined) {
      updates.push('max_discount_amount = ?');
      values.push(max_discount_amount);
    }
    if (starts_at !== undefined) {
      updates.push('starts_at = ?');
      values.push(starts_at);
    }
    if (ends_at !== undefined) {
      updates.push('ends_at = ?');
      values.push(ends_at);
    }
    if (usage_limit !== undefined) {
      updates.push('usage_limit = ?');
      values.push(usage_limit);
    }
    if (usage_limit_per_user !== undefined) {
      updates.push('usage_limit_per_user = ?');
      values.push(usage_limit_per_user);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không có trường nào để cập nhật' },
        { status: 400 }
      );
    }

    values.push(couponId);

    await executeQuery(
      `UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công'
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth(request);
    const couponId = params.id;

    if (!couponId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID mã giảm giá' },
        { status: 400 }
      );
    }

    await executeQuery('DELETE FROM coupons WHERE id = ?', [couponId]);

    return NextResponse.json({
      success: true,
      message: 'Xóa mã giảm giá thành công'
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}
