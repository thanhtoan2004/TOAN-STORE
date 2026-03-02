import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { getCache, setCache } from '@/lib/cache';

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
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // 2. Fallback to Database
    const result = await executeQuery(
      `SELECT 
        c.id, c.name, c.slug, c.description, c.position, 
        COALESCE(NULLIF(c.image_url, ''), (
          SELECT pi.url 
          FROM product_images pi 
          JOIN products p ON pi.product_id = p.id 
          WHERE p.category_id = c.id AND p.is_active = 1 
          ORDER BY p.id DESC 
          LIMIT 1
        )) as image_url 
      FROM categories c 
      WHERE c.is_active = 1 AND c.deleted_at IS NULL
      ORDER BY c.position ASC`
    );

    // 3. Save to cache
    await setCache(CATEGORIES_CACHE_KEY, result, CACHE_TTL);

    return NextResponse.json({
      success: true,
      data: result,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching categories' },
      { status: 500 }
    );
  }
}
