import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { flashSales, flashSaleItems, products, productImages } from '@/lib/db/schema';
import { eq, and, lte, gt, desc, sql, asc, isNull } from 'drizzle-orm';
import { getCache, setCache } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy chương trình Flash Sale đang diễn ra (Active).
 * Đặc điểm kỹ thuật:
 * 1. Filtering: Tự động so sánh thời gian hệ thống với `start_time` và `end_time` trong Database.
 * 2. Caching: Dùng Redis Cache 5 phút. Trong sự kiện Flash Sale, hàng ngàn người sẽ F5 trang chủ cùng lúc, việc Cache giúp Server không bị "die" vì query SQL quá nhiều.
 * 3. Data Mapping: Trả về danh sách sản phẩm kèm theo % giảm giá và tiến độ đã bán (quantity_sold).
 */
export async function GET() {
  try {
    const CACHE_KEY = 'flash-sale:active';

    // Try to get from cache
    const cachedData = await getCache<any>(CACHE_KEY);
    if (cachedData) {
      return ResponseWrapper.success(cachedData, undefined, 200, { cached: true });
    }

    const now = new Date();

    // 1. Get active flash sale
    const [flashSale] = await db
      .select()
      .from(flashSales)
      .where(
        and(
          eq(flashSales.isActive, 1),
          lte(flashSales.startTime, now),
          gt(flashSales.endTime, now),
          isNull(flashSales.deletedAt)
        )
      )
      .orderBy(desc(flashSales.startTime))
      .limit(1);

    if (!flashSale) {
      return ResponseWrapper.success(null);
    }

    // 2. Get flash sale products
    const flashProducts = await db
      .select({
        productId: flashSaleItems.productId,
        discountPercentage: flashSaleItems.discountPercentage,
        flashPrice: flashSaleItems.flashPrice,
        quantityLimit: flashSaleItems.quantityLimit,
        quantitySold: flashSaleItems.quantitySold,
        name: products.name,
        slug: products.slug,
        originalPrice: products.priceCache,
        imageUrl: sql<string>`(SELECT url FROM ${productImages} WHERE product_id = ${products.id} AND is_main = 1 LIMIT 1)`,
      })
      .from(flashSaleItems)
      .innerJoin(products, eq(flashSaleItems.productId, products.id))
      .where(and(eq(flashSaleItems.flashSaleId, flashSale.id), eq(products.isActive, 1)))
      .orderBy(asc(flashSaleItems.createdAt));

    const responseData = {
      id: flashSale.id,
      name: flashSale.name,
      description: flashSale.description,
      startTime: flashSale.startTime,
      endTime: flashSale.endTime,
      products: flashProducts.map((item: any) => ({
        id: item.productId,
        name: item.name,
        slug: item.slug,
        imageUrl: item.imageUrl,
        originalPrice: item.originalPrice ? parseFloat(item.originalPrice.toString()) : 0,
        flashPrice: item.flashPrice ? parseFloat(item.flashPrice.toString()) : 0,
        discountPercentage: item.discountPercentage
          ? parseFloat(item.discountPercentage.toString())
          : 0,
        quantityLimit: item.quantityLimit,
        quantitySold: item.quantitySold,
      })),
    };

    // Cache for 5 minutes
    await setCache(CACHE_KEY, responseData, 300);

    return ResponseWrapper.success(responseData);
  } catch (error) {
    console.error('Get flash sale error:', error);
    return ResponseWrapper.serverError('Failed to get flash sale', error);
  }
}
