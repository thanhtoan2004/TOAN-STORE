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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM contact_messages WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const data = await executeQuery(query, params) as any[];

    let countQuery = 'SELECT COUNT(*) as total FROM contact_messages WHERE 1=1';
    const countParams: any[] = [];
    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRow] = await executeQuery(countQuery, countParams) as any[];
    const total = countRow?.total || 0;

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
