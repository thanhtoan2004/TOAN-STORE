import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { news as newsTable, adminUsers } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy chi tiết một bài tin tức theo Slug.
 * Dùng cho trang chi tiết tin tức (Blog Detail Page).
 * Tự động tăng lượt xem (Views) mỗi khi truy cập.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const result = await db
      .select({
        id: newsTable.id,
        title: newsTable.title,
        slug: newsTable.slug,
        excerpt: newsTable.excerpt,
        content: newsTable.content,
        imageUrl: newsTable.imageUrl,
        category: newsTable.category,
        authorId: newsTable.authorId,
        authorName: adminUsers.fullName,
        publishedAt: newsTable.publishedAt,
        views: newsTable.views,
        createdAt: newsTable.createdAt,
      })
      .from(newsTable)
      .leftJoin(adminUsers, eq(newsTable.authorId, adminUsers.id))
      .where(and(eq(newsTable.slug, slug), eq(newsTable.isPublished, 1)))
      .limit(1);

    if (result.length === 0) {
      return ResponseWrapper.notFound('News not found');
    }

    // Increment view count asynchronously
    db.update(newsTable)
      .set({ views: sql`${newsTable.views} + 1` })
      .where(eq(newsTable.slug, slug))
      .catch((err) => console.error('Error incrementing news views:', err));

    return ResponseWrapper.success(result[0]);
  } catch (error) {
    console.error('Error fetching news detail:', error);
    return ResponseWrapper.serverError('Error fetching news', error);
  }
}
