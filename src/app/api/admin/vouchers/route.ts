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

    // Check if code already exists
    const existing = await executeQuery(`SELECT id, deleted_at FROM vouchers WHERE code = ?`, [code]) as any[];
    const isDeletedExist = existing.length > 0 && existing[0].deleted_at !== null;

    if (existing.length > 0 && !isDeletedExist) {
      return NextResponse.json(
        { success: false, message: 'Mã voucher này đã tồn tại và đang hoạt động.' },
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

    let result;
    try {
      if (isDeletedExist) {
        // SMART RESTORE: Update existing soft-deleted record
        const voucherId = existing[0].id;
        await executeQuery(
          `UPDATE vouchers SET value = ?, description = ?, recipient_user_id = ?, valid_until = ?, 
           discount_type = ?, min_order_value = ?, applicable_categories = ?, applicable_tier = ?, 
           status = 'active', deleted_at = NULL, updated_at = NOW() 
           WHERE id = ?`,
          [numValue, description || null, targetUserId, valid_until || null, discount_type || 'fixed', numMinOrder, cats, applicable_tier || 'bronze', voucherId]
        );
        result = { insertId: voucherId };
      } else {
        // NORMAL INSERT
        result = await executeQuery(
          `INSERT INTO vouchers (code, value, description, recipient_user_id, valid_until, discount_type, min_order_value, applicable_categories, applicable_tier, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
          [code, numValue, description || null, targetUserId, valid_until || null, discount_type || 'fixed', numMinOrder, cats, applicable_tier || 'bronze']
        ) as any;
      }
    } catch (dbError: any) {
      console.error('Database error details:', dbError);

      // Handle Unique Constraint specifically if the check above missed it (race condition)
      if (dbError.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { success: false, message: 'Mã voucher đã tồn tại trong hệ thống (Duplicate Code)' },
          { status: 400 }
        );
      }

      throw dbError; // Rethrow other errors to be caught by the outer catch
    }

    const responseData = {
      success: true,
      message: 'Voucher created successfully',
      data: { id: result.insertId, code, value, description }
    };

    // Log audit
    await logAdminAction(adminAuth.userId, 'create_voucher', 'vouchers', result.insertId, { code, value }, request);

    // Send email if recipient_email was provided
    if (recipient_email && targetUserId) {
      const { sendVoucherReceivedEmail } = await import('@/lib/mail');

      // Fetch full name to use as greeting
      const userResult = await executeQuery('SELECT full_name, promo_notifications FROM users WHERE id = ?', [targetUserId]) as any[];
      const user = userResult[0];
      const recipientName = user?.full_name?.trim().split(' ')[0] || recipient_email.split('@')[0];

      sendVoucherReceivedEmail(recipient_email, recipientName, code, numValue, discount_type || 'fixed', numMinOrder).catch(console.error);

      // Send NOTIFICATION to user (In-app)
      if (user?.promo_notifications === 1) {
        const promoValueStr = discount_type === 'percent'
          ? `${numValue}%`
          : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numValue);

        executeQuery(
          `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
           VALUES (?, 'promo', ?, ?, ?, 0, NOW())`,
          [
            targetUserId,
            'Bạn vừa nhận được voucher mới!',
            `Chúc mừng! Bạn vừa nhận được mã giảm giá ${code} trị giá ${promoValueStr}. Hãy sử dụng ngay!`,
            '/account/vouchers'
          ]
        ).catch(err => console.error('Error inserting voucher notification:', err));
      }
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

    // Check if new code already exists (including soft-deleted if index is strict)
    let isRestoringFromDeleted = false;
    let existingDeletedId = null;
    if (code) {
      const existing = await executeQuery(
        `SELECT id, deleted_at FROM vouchers WHERE code = ? AND id != ?`,
        [code, id]
      ) as any[];
      if (existing.length > 0) {
        const isDeleted = existing[0].deleted_at !== null;
        if (!isDeleted) {
          return NextResponse.json(
            { success: false, message: 'Mã voucher này đã tồn tại và đang hoạt động.' },
            { status: 400 }
          );
        } else {
          // New code matches a deleted voucher. We can't easily "merge" them via PUT.
          // In enterprise, we usually block this or suggest hard-deleting the old one.
          // For now, let's inform the user.
          return NextResponse.json(
            { success: false, message: 'Mã mới này trùng với một voucher đã bị xóa. Vui lòng dùng mã khác.' },
            { status: 400 }
          );
        }
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

    try {
      await executeQuery(
        `UPDATE vouchers SET code = COALESCE(?, code), value = COALESCE(?, value),
                           description = COALESCE(?, description), recipient_user_id = COALESCE(?, recipient_user_id), valid_until = COALESCE(?, valid_until), 
                           status = COALESCE(?, status), 
                           discount_type = COALESCE(?, discount_type),
                           min_order_value = COALESCE(?, min_order_value),
                           applicable_categories = COALESCE(?, applicable_categories),
                           applicable_tier = COALESCE(?, applicable_tier),
                           updated_at = NOW() 
         WHERE id = ?`,
        [code || null, numValue, description === undefined ? undefined : (description || null), targetUserId === undefined ? undefined : targetUserId, valid_until === undefined ? undefined : (valid_until || null), status || null, discount_type || null, numMinOrder, cats, applicable_tier || null, id]
      );
    } catch (dbError: any) {
      console.error('Update voucher error:', dbError);
      if (dbError.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { success: false, message: 'Mã voucher đã tồn tại (Duplicate Code)' },
          { status: 400 }
        );
      }
      throw dbError;
    }

    // Log audit
    await logAdminAction(adminAuth.userId, 'update_voucher', 'vouchers', id, { code, status }, request);

    // If assigned to a user during update, send notification
    if (targetUserId) {
      const userResult = await executeQuery('SELECT promo_notifications FROM users WHERE id = ?', [targetUserId]) as any[];
      if (userResult[0]?.promo_notifications === 1) {
        // Fetch current voucher info for message
        const currentVoucher = await executeQuery('SELECT code, value, discount_type FROM vouchers WHERE id = ?', [id]) as any[];
        const v = currentVoucher[0];
        if (v) {
          const promoValueStr = v.discount_type === 'percent'
            ? `${v.value}%`
            : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(v.value));

          executeQuery(
            `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
             VALUES (?, 'promo', ?, ?, ?, 0, NOW())`,
            [
              targetUserId,
              'Bạn vừa nhận được voucher mới!',
              `Chúc mừng! Bạn vừa nhận được mã giảm giá ${v.code} trị giá ${promoValueStr}. Hãy sử dụng ngay!`,
              '/account/vouchers'
            ]
          ).catch(err => console.error('Error inserting voucher update notification:', err));
        }
      }
    }

    // Send email if recipient_email was provided/updated and it's valid
    if (recipient_email && targetUserId) {
      // Need to fetch current values if some are not provided in update (for the email content)
      // But for simplicity, we only send if all info is available or we accept partial info might be confusing?
      // Better strategy: Only send if we have enough info to make the email useful.
      // We have code, value/numValue, discount_type, min_order_value/numMinOrder from the request.
      // If they are missing from request (undefined), we might need to fetch them.

      // Let's fetch the full voucher to be sure what we are sending
      const [updatedVoucher]: any = await executeQuery(
        'SELECT code, value, discount_type, min_order_value, description FROM vouchers WHERE id = ?',
        [id]
      );

      if (updatedVoucher.length > 0) {
        const { sendVoucherReceivedEmail } = await import('@/lib/mail');

        // Fetch full name to use as greeting
        const userDetails = await executeQuery('SELECT full_name FROM users WHERE email = ?', [recipient_email]) as any[];
        const recipientName = userDetails[0]?.full_name?.trim().split(' ')[0] || recipient_email.split('@')[0];

        sendVoucherReceivedEmail(
          recipient_email,
          recipientName,
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
