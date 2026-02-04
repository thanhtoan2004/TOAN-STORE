import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { JWTPayload } from '@/types/auth';

// Middleware kiểm tra admin
async function checkAdminAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as JWTPayload;

    const users = await executeQuery(
      'SELECT is_admin FROM users WHERE id = ?',
      [decoded.userId]
    ) as any[];

    if (users.length === 0 || users[0].is_admin !== 1) return null;

    return { isAdmin: true, userId: decoded.userId };
  } catch {
    return null;
  }
}

// GET - Lấy danh sách đơn hàng (Admin)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, u.full_name as customer_name, u.email as customer_email,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1`;

    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (o.order_number LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR o.shipping_address LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY o.id ORDER BY o.placed_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const orders = await executeQuery(query, params);

    // Get total count
    // Get total count

    // Let's restart the count query build to be safe and consistent with main query
    let countQuery = `
      SELECT COUNT(DISTINCT o.id) as total 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE 1=1`;
    const countParams: any[] = [];

    if (status && status !== 'all') {
      countQuery += ' AND o.status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (o.order_number LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR o.shipping_address LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countRow] = await executeQuery<any[]>(countQuery, countParams);
    const total = countRow?.total || 0;

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
