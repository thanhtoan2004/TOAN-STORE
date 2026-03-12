import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth/auth';

// GET /api/admin/warehouses - List all warehouses
/**
 * API Lấy danh sách toàn bộ các kho hàng (Warehouses).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const warehouses = await executeQuery<any[]>('SELECT * FROM warehouses ORDER BY id ASC');

    return NextResponse.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}

// POST /api/admin/warehouses - Create new warehouse
/**
 * API Thêm mới kho hàng vào hệ thống.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, location } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Tên kho là bắt buộc' }, { status: 400 });
    }

    const result = (await executeQuery('INSERT INTO warehouses (name, location) VALUES (?, ?)', [
      name,
      location || '',
    ])) as any;

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, name, location },
      message: 'Thêm kho thành công',
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
