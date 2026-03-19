import { NextRequest, NextResponse } from 'next/server';
import { getMeiliClient, PRODUCT_INDEX } from '@/lib/search/meilisearch';
import { db } from '@/lib/db/drizzle';
import { searchAnalytics } from '@/lib/db/schema';
import { getCache, setCache } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Tìm kiếm sản phẩm thông minh (Full-text Search).
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!q || q.trim().length < 2) {
      return ResponseWrapper.error('Từ khóa tìm kiếm phải có ít nhất 2 ký tự', 400);
    }

    const index = getMeiliClient().index(PRODUCT_INDEX);

    // Filter construction
    const filters: string[] = ['is_active = true'];
    if (category) {
      filters.push(`category_name = "${category}"`);
    }

    const cacheKey = `search:query:${q}:${category || 'all'}:${limit}:${offset}`;
    const cachedResults = await getCache<any>(cacheKey);
    if (cachedResults) {
      return ResponseWrapper.success(cachedResults, undefined, 200, { cached: true });
    }

    const searchResults = await index.search(q, {
      limit,
      offset,
      filter: filters.length > 0 ? filters.join(' AND ') : undefined,
      attributesToHighlight: ['name', 'category_name', 'brand_name'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    });

    const responseData = {
      products: searchResults.hits,
      query: q,
      processingTimeMs: searchResults.processingTimeMs,
    };

    const pagination = {
      total: searchResults.estimatedTotalHits || 0,
      limit: searchResults.limit,
      offset: searchResults.offset,
      hasMore:
        (searchResults.offset || 0) + (searchResults.limit || 0) <
        (searchResults.estimatedTotalHits || 0),
    };

    await setCache(cacheKey, responseData, 1800);

    // Log search query
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    db.insert(searchAnalytics)
      .values({
        query: q.substring(0, 255),
        categoryFilter: category || null,
        resultsCount: searchResults.estimatedTotalHits || 0,
        processingTimeMs: searchResults.processingTimeMs || 0,
        ipAddress: ip,
      })
      .catch(() => {});

    return ResponseWrapper.success(responseData, 'Search results fetched', 200, pagination);
  } catch (error: any) {
    console.error('Search error details:', error);
    return ResponseWrapper.serverError('Lỗi khi tìm kiếm sản phẩm', error);
  }
}
