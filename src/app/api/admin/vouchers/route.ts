import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

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
              recipient_user_id, redeemed_by_user_id, 
              valid_from, valid_until, redeemed_at, created_at, updated_at
       FROM vouchers 
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];

    const [countRow] = await executeQuery(`SELECT COUNT(*) as total FROM vouchers`) as any[];
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

    const { code, value, description, recipient_user_id, valid_until } = await request.json();

    if (!code || !value) {
      return NextResponse.json(
        { success: false, message: 'Code and value are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await executeQuery(`SELECT id FROM vouchers WHERE code = ?`, [code]) as any[];
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Voucher code already exists' },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO vouchers (code, value, description, recipient_user_id, valid_until, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [code, parseFloat(value.toString()), description || null, recipient_user_id || null, valid_until || null]
    ) as any;

    return NextResponse.json({
      success: true,
      message: 'Voucher created successfully',
      data: { id: result.insertId, code, value, description }
    });
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

    const { id, code, value, description, recipient_user_id, valid_until, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if new code already exists (different voucher)
    if (code) {
      const existing = await executeQuery(
        `SELECT id FROM vouchers WHERE code = ? AND id != ?`,
        [code, id]
      ) as any[];
      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Voucher code already exists' },
          { status: 400 }
        );
      }
    }

    await executeQuery(
      `UPDATE vouchers SET code = COALESCE(?, code), value = COALESCE(?, value),
                         description = ?, recipient_user_id = ?, valid_until = ?, 
                         status = COALESCE(?, status), updated_at = NOW() 
       WHERE id = ?`,
      [code || null, value ? parseFloat(value.toString()) : null, description || null,
      recipient_user_id || null, valid_until || null, status || null, id]
    );

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

    await executeQuery(`DELETE FROM vouchers WHERE id = ?`, [id]);

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
