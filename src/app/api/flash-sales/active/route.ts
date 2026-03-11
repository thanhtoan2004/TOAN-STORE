import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { getCache, setCache } from '@/lib/cache';

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
      return NextResponse.json({
        success: true,
        data: cachedData,
      });
    }

    const now = new Date();

    // Get active flash sale
    const [flashSale] = await query(
      `SELECT * FROM flash_sales
       WHERE is_active = 1
         AND start_time <= ?
         AND end_time > ?
       ORDER BY start_time DESC
       LIMIT 1`,
      [now, now]
    );

    if (!flashSale) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Get flash sale products
    const products = await query(
      `SELECT 
        fsi.*,
        p.name,
        p.slug,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as imageUrl,
        p.price_cache as originalPrice
       FROM flash_sale_items fsi
       JOIN products p ON fsi.product_id = p.id
       WHERE fsi.flash_sale_id = ?
         AND p.is_active = 1
       ORDER BY fsi.created_at ASC`,
      [flashSale.id]
    );

    const responseData = {
      id: flashSale.id,
      name: flashSale.name,
      description: flashSale.description,
      startTime: flashSale.start_time,
      endTime: flashSale.end_time,
      products: products.map((item: any) => ({
        id: item.product_id,
        name: item.name,
        slug: item.slug,
        imageUrl: item.imageUrl,
        originalPrice: parseFloat(item.originalPrice),
        flashPrice: parseFloat(item.flash_price),
        discountPercentage: parseFloat(item.discount_percentage),
        quantityLimit: item.quantity_limit,
        quantitySold: item.quantity_sold,
      })),
    };

    // Cache for 5 minutes
    await setCache(CACHE_KEY, responseData, 300);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Get flash sale error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get flash sale',
      },
      { status: 500 }
    );
  }
}
