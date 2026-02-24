import { NextRequest, NextResponse } from 'next/server';
import { getMeiliClient, PRODUCT_INDEX } from '@/lib/meilisearch';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API Tìm kiếm sản phẩm thông minh (Full-text Search).
 * Công nghệ sử dụng:
 * - Meilisearch: Cung cấp kết quả tìm kiếm tức thì, hỗ trợ Highlighting và Typo-tolerance.
 * - Search Analytics: Ghi lại từ khóa và hiệu suất tìm kiếm để Admin phân tích xu hướng người dùng.
 * Ràng buộc: Từ khóa phải từ 2 ký tự trở lên.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        success: false,
        message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
      }, { status: 400 });
    }

    const index = getMeiliClient().index(PRODUCT_INDEX);

    // Filter construction
    const filters: string[] = ['is_active = true'];
    if (category) {
      filters.push(`category_name = "${category}"`);
    }

    // Perform search
    const searchResults = await index.search(q, {
      limit,
      offset,
      filter: filters.length > 0 ? filters.join(' AND ') : undefined,
      attributesToHighlight: ['name', 'category_name', 'brand_name'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    });

    // Log search query (fire-and-forget, don't block response)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';
    executeQuery(
      `INSERT INTO search_analytics (query, category_filter, results_count, processing_time_ms, ip_address) VALUES (?, ?, ?, ?, ?)`,
      [q.substring(0, 255), category || null, searchResults.estimatedTotalHits || 0, searchResults.processingTimeMs || 0, ip]
    ).catch(() => { /* silently ignore logging errors */ });

    return NextResponse.json({
      success: true,
      data: {
        products: searchResults.hits,
        pagination: {
          total: searchResults.estimatedTotalHits || 0,
          limit: searchResults.limit,
          offset: searchResults.offset,
          hasMore: (searchResults.offset || 0) + (searchResults.limit || 0) < (searchResults.estimatedTotalHits || 0)
        },
        query: q,
        processingTimeMs: searchResults.processingTimeMs
      }
    });

  } catch (error: any) {
    console.error('Search error details:', error);
    if (error.response) {
      console.error('Meilisearch response error:', error.response);
    }
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi tìm kiếm sản phẩm'
    }, { status: 500 });
  }
}

