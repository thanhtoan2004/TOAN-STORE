import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { categories, products, productImages } from '@/lib/db/schema';
import { eq, and, isNull, sql, asc, desc } from 'drizzle-orm';
import { getCache, setCache } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

const CATEGORIES_CACHE_KEY = 'global:categories';
const CACHE_TTL = 3600; // 1 hour

/**
 * API Lấy danh sách danh mục sản phẩm đang hoạt động.
 * Logic bổ trợ: Nếu danh mục không có ảnh đại diện riêng, hệ thống tự động lấy ảnh của sản phẩm mới nhất thuộc danh mục đó để hiển thị.
 */
export async function GET() {
  try {
    // 1. Try to get from cache first
    const cachedData = await getCache<any[]>(CATEGORIES_CACHE_KEY);
    if (cachedData) {
      return ResponseWrapper.success(cachedData, undefined, 200, { cached: true });
    }

    // 2. Fallback to Database using Drizzle ORM
    // Subquery to get the latest product image if category image is missing
    const latestImageSubquery = db
      .select({ url: productImages.url })
      .from(productImages)
      .innerJoin(products, eq(productImages.productId, products.id))
      .where(and(eq(products.categoryId, categories.id), eq(products.isActive, 1)))
      .orderBy(desc(products.id))
      .limit(1);

    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        position: categories.position,
        imageUrl: sql<string>`COALESCE(NULLIF(${categories.imageUrl}, ''), (${latestImageSubquery}))`,
      })
      .from(categories)
      .where(and(eq(categories.isActive, 1), isNull(categories.deletedAt)))
      .orderBy(asc(categories.position));

    // 3. Save to cache
    await setCache(CATEGORIES_CACHE_KEY, result, CACHE_TTL);

    return ResponseWrapper.success(result, undefined, 200, { cached: false });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ResponseWrapper.serverError('Error fetching categories', error);
  }
}
