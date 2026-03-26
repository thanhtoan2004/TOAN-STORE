import { NextRequest, NextResponse } from 'next/server';
import { ResponseWrapper } from '@/lib/api/api-response';
import { getProducts } from '@/lib/db/mysql';
import { getCache, setCache } from '@/lib/redis/cache';
import {
  getActiveBulkDiscounts,
  applyBulkDiscount,
  getActiveFlashSaleItems,
} from '@/lib/marketing/discounts';

/**
 * API Lấy danh sách sản phẩm (Product Catalog).
 * Hỗ trợ các tính năng nâng cao:
 * 1. Filtering: Theo Giới tính, Category, Sport, Color, Khoảng giá.
 * 2. Tìm kiếm: Tích hợp Full-Text Search từ MySQL.
 * 3. Sorting: Theo giá, tên, độ giảm giá, hoặc mới nhất.
 * 4. Caching: Sử dụng Redis/In-memory Cache (30 phút) để giảm tải cho Database.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 12;
    const sort = searchParams.get('sort') || 'newest';
    const gender = searchParams.get('gender');
    const category = searchParams.get('category');
    const sport = searchParams.get('sport');
    const color = searchParams.get('color');
    const price = searchParams.get('price');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const isNewArrival = searchParams.get('isNewArrival') === 'true';

    const offset = (page - 1) * limit;

    // Cache key based on search params
    const cacheKey = `products:list:${searchParams.toString() || 'default'}`;
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData) {
      return ResponseWrapper.success(cachedData.products, undefined, 200, cachedData.pagination);
    }

    // Build filters for database query
    const filters: any = {
      limit,
      offset,
      sort: sort || 'newest', // FIX H3: Pass sort for SQL ORDER BY
      search: search || undefined,
    };

    if (category && category !== 'all') {
      filters.category = category;
    }

    if (sport && sport !== 'all') {
      filters.sport = sport;
    }

    if (gender && gender !== 'all') {
      filters.gender = gender;
    }

    if (minPrice) {
      filters.minPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      filters.maxPrice = parseFloat(maxPrice);
    }

    if (price) {
      switch (price) {
        case 'under-1000000':
          filters.maxPrice = 1000000;
          break;
        case '1000000-2000000':
          filters.minPrice = 1000000;
          filters.maxPrice = 2000000;
          break;
        case '2000000-3000000':
          filters.minPrice = 2000000;
          filters.maxPrice = 3000000;
          break;
        case 'over-3000000':
          filters.minPrice = 3000000;
          break;
      }
    }

    if (isNewArrival) {
      filters.isNewArrival = true;
    }

    // Get products and total count from database (Optimized)
    const { items: productsData, total: totalCount } = await getProducts(filters);
    const [activeDiscounts, flashItems] = await Promise.all([
      getActiveBulkDiscounts(),
      getActiveFlashSaleItems(),
    ]);

    // Convert camelCase and apply discounts
    const products = productsData.map((p: any) => {
      const discounted = applyBulkDiscount(p, activeDiscounts, flashItems);
      return {
        ...discounted,
        price_cache: discounted.priceCache ? parseFloat(discounted.priceCache.toString()) : 0,
        msrp_price: discounted.msrpPrice ? parseFloat(discounted.msrpPrice.toString()) : 0,
        image_url: discounted.imageUrl || '/placeholder.png',
        is_new_arrival: discounted.isNewArrival || false,
      };
    });

    // FIX H3: Sorting now done at SQL level via getProducts() — no JS sort needed
    // This fixes incorrect pagination (JS sort only sorted within 1 page)

    const total = totalCount;
    const totalPages = Math.ceil(total / limit);

    const responseData = {
      success: true,
      products: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    // Save to cache for 30 minutes
    await setCache(cacheKey, responseData, 1800);

    return ResponseWrapper.success(responseData.products, undefined, 200, responseData.pagination);
  } catch (error) {
    console.error('Error fetching products:', error);
    return ResponseWrapper.serverError('Failed to fetch products', error);
  }
}
