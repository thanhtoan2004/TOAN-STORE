import { NextRequest, NextResponse } from 'next/server';
import { meiliClient, PRODUCT_INDEX } from '@/lib/meilisearch';

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

    const index = meiliClient.index(PRODUCT_INDEX);

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
