import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * API Thống kê Wishlist (Danh sách mong muốn).
 * Chức năng:
 * 1. Xếp hạng các sản phẩm được đưa vào Wishlist nhiều nhất.
 * 2. Cung cấp số liệu tổng quan về mức độ quan tâm của khách hàng đối với từng sản phẩm.
 * 3. Hỗ trợ Admin trong việc đưa ra quyết định nhập hàng hoặc khuyến mãi.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // M2: Cap limit
    const offset = (page - 1) * limit;

    // Get wishlist items with product info and count how many times each product is in wishlists
    const data = (await executeQuery(
      `SELECT p.id, p.name, p.sku, 
              COALESCE(MAX(pi.url), '') as image_url,
              COUNT(DISTINCT wi.id) as wishlist_count, COUNT(DISTINCT w.user_id) as unique_users
       FROM products p
       INNER JOIN wishlist_items wi ON p.id = wi.product_id
       INNER JOIN wishlists w ON wi.wishlist_id = w.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
       GROUP BY p.id
       ORDER BY wishlist_count DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )) as any[];

    const [countRow] = (await executeQuery(
      'SELECT COUNT(DISTINCT product_id) as total FROM wishlist_items'
    )) as any[];
    const totalProductsWishlisted = countRow?.total || 0;

    // Summary + wishlists (the container per user)
    const wishlistSummaryRows = await executeQuery<any[]>(
      `SELECT 
         (SELECT COUNT(*) FROM wishlists) as total_wishlists,
         (SELECT COUNT(*) FROM wishlist_items) as total_wishlist_items,
         (SELECT COUNT(DISTINCT user_id) FROM wishlists) as total_users_with_wishlist
       `
    );
    const summary = wishlistSummaryRows?.[0] || {
      total_wishlists: 0,
      total_wishlist_items: 0,
      total_users_with_wishlist: 0,
    };

    // Show latest wishlists with item counts (no pagination needed for now)
    const wishlists = await executeQuery<any[]>(
      `SELECT 
         w.id,
         w.user_id,
         w.name,
         w.is_default,
         w.created_at,
         COUNT(wi.id) as item_count
       FROM wishlists w
       LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
       GROUP BY w.id
       ORDER BY w.created_at DESC
       LIMIT 50`
    );

    return NextResponse.json({
      success: true,
      data,
      wishlists,
      summary,
      pagination: {
        page,
        limit,
        total: totalProductsWishlisted,
        totalPages: Math.ceil(totalProductsWishlisted / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching wishlist stats:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
