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
    await checkAdminAuth(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get wishlist items with product info and count how many times each product is in wishlists
    const data = await executeQuery(
      `SELECT p.id, p.name, p.sku, 
              COALESCE(pi.image_url, '') as image_url,
              COUNT(DISTINCT wi.id) as wishlist_count, COUNT(DISTINCT wi.user_id) as unique_users
       FROM products p
       LEFT JOIN wishlist_items wi ON p.id = wi.product_id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
       GROUP BY p.id
       ORDER BY wishlist_count DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];

    const countResult = await executeQuery('SELECT COUNT(DISTINCT product_id) as total FROM wishlist_items') as any[];
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching wishlist stats:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
