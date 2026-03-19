import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  products as productsTable,
  wishlistItems,
  wishlists as wishlistsTable,
  productImages,
} from '@/lib/db/schema';
import { eq, and, sql, desc, count, countDistinct } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET - Thống kê Wishlist (Danh sách mong muốn).
 * Updated: 2026-03-13 - Fix order by alias issue
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // 1. Get wishlist items ranking
    const data = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        sku: productsTable.sku,
        image_url: sql<string>`(SELECT ${productImages.url} FROM ${productImages} WHERE ${productImages.productId} = ${productsTable.id} ORDER BY ${productImages.isMain} DESC, ${productImages.position} ASC LIMIT 1)`,
        wishlist_count: count(wishlistItems.id),
        unique_users: countDistinct(wishlistsTable.userId),
      })
      .from(productsTable)
      .innerJoin(wishlistItems, eq(productsTable.id, wishlistItems.productId))
      .innerJoin(wishlistsTable, eq(wishlistItems.wishlistId, wishlistsTable.id))
      .groupBy(productsTable.id)
      .orderBy(desc(count(wishlistItems.id)))
      .limit(limit)
      .offset(offset);

    // 2. Get total products wishlisted
    const [countRow] = await db
      .select({ total: countDistinct(wishlistItems.productId) })
      .from(wishlistItems);
    const totalProductsWishlisted = countRow?.total || 0;

    // 3. Get Summary stats
    const [totalWishlists] = await db.select({ val: count() }).from(wishlistsTable);
    const [totalWishlistItems] = await db.select({ val: count() }).from(wishlistItems);
    const [totalUsersWithWishlist] = await db
      .select({ val: countDistinct(wishlistsTable.userId) })
      .from(wishlistsTable);

    const summary = {
      total_wishlists: totalWishlists?.val || 0,
      total_wishlist_items: totalWishlistItems?.val || 0,
      total_users_with_wishlist: totalUsersWithWishlist?.val || 0,
    };

    // 4. Get latest wishlists
    const wishlists = await db
      .select({
        id: wishlistsTable.id,
        user_id: wishlistsTable.userId,
        name: wishlistsTable.name,
        is_default: wishlistsTable.isDefault,
        created_at: wishlistsTable.createdAt,
        item_count: count(wishlistItems.id),
      })
      .from(wishlistsTable)
      .leftJoin(wishlistItems, eq(wishlistsTable.id, wishlistItems.wishlistId))
      .groupBy(wishlistsTable.id)
      .orderBy(desc(wishlistsTable.createdAt))
      .limit(50);

    const result = {
      items: data,
      wishlists,
      summary,
      pagination: {
        page,
        limit,
        total: totalProductsWishlisted,
        totalPages: Math.ceil(totalProductsWishlisted / limit),
      },
    };

    return ResponseWrapper.success(result);
  } catch (error) {
    console.error('Error fetching wishlist stats:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
