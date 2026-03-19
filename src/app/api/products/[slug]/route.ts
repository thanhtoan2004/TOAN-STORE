import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productImages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getProductById, getProductSizes, getProductBySlug } from '@/lib/db/repositories/product';
import { getCache, setCache } from '@/lib/redis/cache';
import { getActiveBulkDiscounts, applyBulkDiscount } from '@/lib/marketing/discounts';
import { ResponseWrapper } from '@/lib/api/api-response';

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

    // Attempt to get from cache (v2 to bypass old stale data with duplicates)
    const cacheKey = `product:v3:detail:slug:${slug}`;
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData) {
      // If the cache contains the full ResponseWrapper structure, we can return it directly.
      // However, to be safe and ensure the structure is always consistent, we re-wrap.
      // Assuming cachedData is { success, data, ... }
      return ResponseWrapper.success(cachedData.data, undefined, 200, cachedData.pagination);
    }
    const isNumericId = /^\d+$/.test(slug);
    let product;

    if (isNumericId) {
      product = await getProductById(parseInt(slug));
    } else {
      product = await getProductBySlug(slug);
    }

    if (!product) {
      return ResponseWrapper.notFound('Product not found');
    }

    const productId = product.id;

    // Get product details from database
    const { getProductAttributes } = await import('@/lib/db/repositories/attribute');
    const [sizes, images, attributes, activeDiscounts] = await Promise.all([
      getProductSizes(productId),
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, productId))
        .orderBy(productImages.position),
      getProductAttributes(productId),
      getActiveBulkDiscounts(),
    ]);

    // Apply bulk discount if applicable
    const discountedProduct = applyBulkDiscount(product, activeDiscounts);

    // Calculate available stock with safety Number casting
    const availableSizes = sizes.filter(
      (s: any) =>
        (Number(s.stock) || 0) - (Number(s.reserved) || 0) > 0 || Number(s.allowBackorder) === 1
    );

    const formattedData = {
      ...discountedProduct,
      priceCache: discountedProduct.priceCache
        ? parseFloat(discountedProduct.priceCache.toString())
        : 0,
      msrpPrice: discountedProduct.msrpPrice
        ? parseFloat(discountedProduct.msrpPrice.toString())
        : 0,
      sizes: sizes.map((s: any) => ({
        ...s,
        stock: Number(s.stock || 0),
        reserved: Number(s.reserved || 0),
        available: Number(s.stock || 0) - Number(s.reserved || 0),
        sku: s.sku,
      })),
      images: images,
      attributes: attributes,
      imageUrl: images.find((img: any) => img.isMain)?.url || images[0]?.url || '/placeholder.png',
      availableSizes: availableSizes.map((s: any) => s.size),
      inStock: availableSizes.length > 0,
    };

    const response = ResponseWrapper.success(formattedData);

    // We need to extract the raw body for caching to avoid caching the NextResponse object itself
    // Actually, the cache currently stores the 'response' object as JSON.
    // To match current caching logic, we cache what would be in the .json() call.
    const cacheValue = {
      success: true,
      data: formattedData,
      timestamp: new Date().toISOString(),
    };

    // Save to cache for 1 hour
    await setCache(cacheKey, cacheValue, 3600);

    return response;
  } catch (error) {
    console.error('Error fetching product:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
