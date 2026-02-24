import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

/**
 * API Lấy danh sách Voucher (Mã giảm giá cá nhân).
 * Hỗ trợ phân trang và hiển thị thông tin người nhận/người đã sử dụng.
 */
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const vouchers = await executeQuery(
      `SELECT v.id, v.code, v.value, v.discount_type, v.description, v.status,
              v.recipient_user_id, u.email as recipient_email, v.redeemed_by_user_id, 
              v.min_order_value, v.applicable_categories, v.applicable_tier,
              v.valid_from, v.valid_until, v.redeemed_at, v.created_at, v.updated_at
       FROM vouchers v
       LEFT JOIN users u ON v.recipient_user_id = u.id
       WHERE v.deleted_at IS NULL
       ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];

    const [countRow] = await executeQuery(`SELECT COUNT(*) as total FROM vouchers WHERE deleted_at IS NULL`) as any[];
    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: vouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching vouchers' },
      { status: 500 }
    );
  }
}

/**
 * API Tạo Voucher mới.
 * Hỗ trợ:
 * 1. Voucher công khai hoặc chỉ dành riêng cho 1 người dùng (qua email).
 * 2. Ràng buộc theo Hạng thành viên (Tier) và Chuyên mục sản phẩm (Categories).
 * 3. Tự động gửi email thông báo cho người nhận nếu được chỉ định.
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code, value, description, recipient_email, valid_until, discount_type, min_order_value, applicable_categories, applicable_tier } = await request.json();

    if (!code || !value) {
      return NextResponse.json(
        { success: false, message: 'Code and value are required' },
        { status: 400 }
      );
    }

    // Check if code already exists (not deleted)
    const existing = await executeQuery(`SELECT id FROM vouchers WHERE code = ? AND deleted_at IS NULL`, [code]) as any[];
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Voucher code already exists' },
        { status: 400 }
      );
    }

    // Validate and lookup recipient_email if provided
    let targetUserId = null;
    if (recipient_email) {
      const userResult = await executeQuery('SELECT id FROM users WHERE email = ?', [recipient_email]) as any[];
      if (userResult.length === 0) {
        return NextResponse.json({ success: false, message: 'Email người nhận không tồn tại' }, { status: 400 });
      }
      targetUserId = userResult[0].id;
    }

    // Parse values
    const numValue = parseFloat(value.toString());
    const numMinOrder = min_order_value ? parseFloat(min_order_value.toString()) : 0;
    const cats = applicable_categories ? JSON.stringify(applicable_categories) : null;

    const result = await executeQuery(
      `INSERT INTO vouchers (code, value, description, recipient_user_id, valid_until, discount_type, min_order_value, applicable_categories, applicable_tier, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [code, numValue, description || null, targetUserId, valid_until || null, discount_type || 'fixed', numMinOrder, cats, applicable_tier || 'bronze']
    ) as any;

    const responseData = {
      success: true,
      message: 'Voucher created successfully',
      data: { id: result.insertId, code, value, description }
    };

    // Log audit
    await logAdminAction(adminAuth.userId, 'create_voucher', 'vouchers', result.insertId, { code, value }, request);

    // Send email if recipient_email was provided
    if (recipient_email) {
      const { sendVoucherReceivedEmail } = await import('@/lib/mail');
      sendVoucherReceivedEmail(recipient_email, code, numValue, discount_type || 'fixed', numMinOrder).catch(console.error);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating voucher' },
      { status: 500 }
    );
  }
}

/**
 * API Cập nhật thông tin Voucher.
 * Tự động gửi email mới nếu thông tin mã thay đổi và có người nhận.
 */
export async function PUT(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, code, value, description, recipient_email, valid_until, status, discount_type, min_order_value, applicable_categories, applicable_tier } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if new code already exists (different voucher)
    if (code) {
      const existing = await executeQuery(
        `SELECT id FROM vouchers WHERE code = ? AND id != ? AND deleted_at IS NULL`,
        [code, id]
      ) as any[];
      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Voucher code already exists' },
          { status: 400 }
        );
      }
    }

    // Validate and lookup recipient_email if provided
    let targetUserId = undefined; // Use undefined to check if it was even passed
    if (recipient_email !== undefined) {
      if (recipient_email) {
        const userResult = await executeQuery('SELECT id FROM users WHERE email = ?', [recipient_email]) as any[];
        if (userResult.length === 0) {
          return NextResponse.json({ success: false, message: 'Email người nhận không tồn tại' }, { status: 400 });
        }
        targetUserId = userResult[0].id;
      } else {
        targetUserId = null;
      }
    }

    // Parse values
    const numValue = value ? parseFloat(value.toString()) : null;
    const numMinOrder = min_order_value !== undefined ? parseFloat(min_order_value.toString()) : null;
    const cats = applicable_categories !== undefined ? (applicable_categories ? JSON.stringify(applicable_categories) : null) : undefined;

    // Construct dynamic update query to handle undefined vs null
    // Actually, simple COALESCE pattern works if we pass everything. But for complex fields:

    await executeQuery(
      `UPDATE vouchers SET code = COALESCE(?, code), value = COALESCE(?, value),
                         description = ?, recipient_user_id = COALESCE(?, recipient_user_id), valid_until = ?, 
                         status = COALESCE(?, status), 
                         discount_type = COALESCE(?, discount_type),
                         min_order_value = COALESCE(?, min_order_value),
                         applicable_categories = COALESCE(?, applicable_categories),
                         applicable_tier = COALESCE(?, applicable_tier),
                         updated_at = NOW() 
       WHERE id = ?`,
      [code || null, numValue, description || null,
        targetUserId, valid_until || null, status || null,
      discount_type || null, numMinOrder, cats, applicable_tier || null, id]
    );

    // Log audit
    await logAdminAction(adminAuth.userId, 'update_voucher', 'vouchers', id, { code, status }, request);

    // Send email if recipient_email was provided/updated and it's valid
    if (recipient_email && targetUserId) {
      // Need to fetch current values if some are not provided in update (for the email content)
      // But for simplicity, we only send if all info is available or we accept partial info might be confusing?
      // Better strategy: Only send if we have enough info to make the email useful.
      // We have code, value/numValue, discount_type, min_order_value/numMinOrder from the request.
      // If they are missing from request (undefined), we might need to fetch them.

      // Let's fetch the full voucher to be sure what we are sending
      const [updatedVoucher]: any = await executeQuery(
        'SELECT code, value, discount_type, min_order_value FROM vouchers WHERE id = ?',
        [id]
      );

      if (updatedVoucher.length > 0) {
        const { sendVoucherReceivedEmail } = await import('@/lib/mail');
        sendVoucherReceivedEmail(
          recipient_email,
          updatedVoucher[0].code,
          updatedVoucher[0].value,
          updatedVoucher[0].discount_type,
          updatedVoucher[0].min_order_value
        ).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Voucher updated successfully'
    });
  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating voucher' },
      { status: 500 }
    );
  }
}

/**
 * API Xóa Voucher (Soft Delete).
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }

    await executeQuery(`UPDATE vouchers SET deleted_at = NOW() WHERE id = ?`, [id]);

    // Log audit
    await logAdminAction(adminAuth.userId, 'soft_delete_voucher', 'vouchers', id, null, request);

    return NextResponse.json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting voucher' },
      { status: 500 }
    );
  }
}
