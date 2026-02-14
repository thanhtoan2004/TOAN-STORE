import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

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
      `SELECT id, code, value, discount_type, description, status,
              recipient_user_id, redeemed_by_user_id, min_order_value, applicable_categories,
              valid_from, valid_until, redeemed_at, created_at, updated_at
       FROM vouchers 
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code, value, description, recipient_user_id, valid_until, discount_type, min_order_value, applicable_categories } = await request.json();

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

    // Validate recipient_user_id if provided
    if (recipient_user_id) {
      const userExists = await executeQuery('SELECT id FROM users WHERE id = ?', [recipient_user_id]) as any[];
      if (userExists.length === 0) {
        return NextResponse.json({ success: false, message: 'Recipient User ID not found' }, { status: 400 });
      }
    }

    // Parse values
    const numValue = parseFloat(value.toString());
    const numMinOrder = min_order_value ? parseFloat(min_order_value.toString()) : 0;
    const cats = applicable_categories ? JSON.stringify(applicable_categories) : null;

    const result = await executeQuery(
      `INSERT INTO vouchers (code, value, description, recipient_user_id, valid_until, discount_type, min_order_value, applicable_categories, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [code, numValue, description || null, recipient_user_id || null, valid_until || null, discount_type || 'fixed', numMinOrder, cats]
    ) as any;

    const responseData = {
      success: true,
      message: 'Voucher created successfully',
      data: { id: result.insertId, code, value, description }
    };

    // Log audit
    await logAdminAction(adminAuth.userId, 'create_voucher', 'vouchers', result.insertId, { code, value }, request);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating voucher' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, code, value, description, recipient_user_id, valid_until, status, discount_type, min_order_value, applicable_categories } = await request.json();

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

    // Validate recipient_user_id if provided
    if (recipient_user_id) {
      const userExists = await executeQuery('SELECT id FROM users WHERE id = ?', [recipient_user_id]) as any[];
      if (userExists.length === 0) {
        return NextResponse.json({ success: false, message: 'Recipient User ID not found' }, { status: 400 });
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
                         description = ?, recipient_user_id = ?, valid_until = ?, 
                         status = COALESCE(?, status), 
                         discount_type = COALESCE(?, discount_type),
                         min_order_value = COALESCE(?, min_order_value),
                         applicable_categories = COALESCE(?, applicable_categories),
                         updated_at = NOW() 
       WHERE id = ?`,
      [code || null, numValue, description || null,
      recipient_user_id || null, valid_until || null, status || null,
      discount_type || null, numMinOrder, cats, id]
    );

    // Log audit
    await logAdminAction(adminAuth.userId, 'update_voucher', 'vouchers', id, { code, status }, request);

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
