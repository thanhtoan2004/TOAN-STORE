import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

async function checkAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1];
    
    if (!authHeader) {
      return null;
    }

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
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.id,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_sku,
        pv.id as variant_id,
        pv.size as variant_size,
        pv.color as variant_color,
        i.quantity,
        i.reserved
      FROM inventory i
      JOIN product_variants pv ON i.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE 1=1
    `;

    let countQuery = 'SELECT COUNT(*) as total FROM inventory i JOIN product_variants pv ON i.product_variant_id = pv.id JOIN products p ON pv.product_id = p.id WHERE 1=1';

    if (search) {
      const searchTerm = `%${search}%`;
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR pv.size LIKE ?)`;
      countQuery += ` AND (p.name LIKE ? OR p.sku LIKE ? OR pv.size LIKE ?)`;
    }

    query += ` ORDER BY p.name ASC LIMIT ? OFFSET ?`;

    const countParams = search ? [search, search, search] : [];
    const countResult = await executeQuery(countQuery, countParams) as any[];
    const total = (countResult[0] as any)?.total || 0;

    const params = search ? [search, search, search, limit, offset] : [limit, offset];
    const data = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ success: false, message: 'Error fetching inventory' }, { status: 500 });
  }
}
