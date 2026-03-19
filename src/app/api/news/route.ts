import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { news as newsTable } from '@/lib/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

// GET - Public news list
/**
 * API Lấy danh sách tin tức (Blog/News) công khai.
 * Chỉ trả về các bài viết đã được xuất bản (is_published = 1).
 * Hỗ trợ phân trang và lọc theo danh mục.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const filters = [eq(newsTable.isPublished, 1)];

    if (category) {
      filters.push(eq(newsTable.category, category));
    }

    // 1. Get Count
    const [countResult] = await db
      .select({ total: count() })
      .from(newsTable)
      .where(and(...filters));

    const total = countResult?.total || 0;

    // 2. Get News
    const news = await db
      .select({
        id: newsTable.id,
        title: newsTable.title,
        slug: newsTable.slug,
        excerpt: newsTable.excerpt,
        imageUrl: newsTable.imageUrl,
        category: newsTable.category,
        publishedAt: newsTable.publishedAt,
        views: newsTable.views,
      })
      .from(newsTable)
      .where(and(...filters))
      .orderBy(desc(newsTable.publishedAt))
      .limit(limit)
      .offset(offset);

    return ResponseWrapper.success(news, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching public news:', error);
    return ResponseWrapper.serverError('Error fetching news', error);
  }
}
