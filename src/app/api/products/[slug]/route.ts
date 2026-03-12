import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getProductSizes, executeQuery } from '@/lib/db/mysql';
import { getCache, setCache } from '@/lib/redis/cache';

/**
 * API Lấy chi tiết thông tin sản phẩm dành cho trang Product Detail Page (PDP).
 * Chức năng:
 * - Tổng hợp dữ liệu từ nhiều bảng: Sản phẩm, Size (Kho), Ảnh và Thuộc tính (Attributes).
 * - Tính toán trạng thái In-Stock và các size khả dụng thực tế.
 * - Caching: Lưu kết quả vào Redis trong 1 giờ để tối ưu tốc độ tải trang.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Attempt to get from cache
    const cacheKey = `product:detail:slug:${slug}`;
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Determine if slug is numeric (fallback for old ID-based links)
    const isNumericId = /^\d+$/.test(slug);
    let product;

    if (isNumericId) {
      product = await getProductById(parseInt(slug));
    } else {
      const { getProductBySlug } = await import('@/lib/db/repositories/product');
      product = await getProductBySlug(slug);
    }

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const productId = product.id;

    // Get product details from database
    // Execute queries in parallel
    const { getProductAttributes } = await import('@/lib/db/repositories/attribute');
    const [sizes, images, attributes] = await Promise.all([
      getProductSizes(productId),
      executeQuery<any[]>(
        'SELECT id, url, alt_text, position, is_main, media_type FROM product_images WHERE product_id = ? ORDER BY position',
        [productId]
      ),
      getProductAttributes(productId),
    ]);

    // Calculate available stock
    const availableSizes = sizes.filter(
      (s: any) => s.stock - s.reserved > 0 || s.allow_backorder === 1
    );

    const response = {
      success: true,
      data: {
        ...product,
        price_cache: product.price_cache ? parseFloat(product.price_cache) : 0,
        msrp_price: product.msrp_price ? parseFloat(product.msrp_price) : 0,
        sizes: sizes.map((s: any) => ({
          ...s,
          available: (s.stock || 0) - (s.reserved || 0),
          sku: s.sku,
        })),
        images: images,
        attributes: attributes,
        image_url:
          images.find((img: any) => img.is_main)?.url || images[0]?.url || '/placeholder.png',
        availableSizes: availableSizes.map((s: any) => s.size),
        inStock: availableSizes.length > 0,
      },
    };

    // Save to cache for 1 hour
    await setCache(cacheKey, response, 3600);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
