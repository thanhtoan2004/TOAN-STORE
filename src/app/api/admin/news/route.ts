import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { news as newsTable, adminUsers } from '@/lib/db/schema';
import { eq, and, like, desc, count, or, sql } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { sanitizeRichContent } from '@/lib/security/sanitize';
import { ResponseWrapper } from '@/lib/api/api-response';

// GET - List all news (admin)
/**
 * API Lấy danh sách tin tức (Dành cho Admin).
 * Hỗ trợ tìm kiếm theo tiêu đề/trích dẫn và lọc theo chuyên mục/trạng thái xuất bản.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const publishedFilter = searchParams.get('published') || '';

    const offset = (page - 1) * limit;

    const filters = [];

    if (search) {
      filters.push(
        or(like(newsTable.title, `%${search}%`), like(newsTable.excerpt, `%${search}%`))
      );
    }

    if (category) {
      filters.push(eq(newsTable.category, category));
    }

    if (publishedFilter === 'published') {
      filters.push(eq(newsTable.isPublished, 1));
    } else if (publishedFilter === 'draft') {
      filters.push(eq(newsTable.isPublished, 0));
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
        image_url: newsTable.imageUrl,
        category: newsTable.category,
        author_id: newsTable.authorId,
        author_name: adminUsers.fullName,
        is_published: newsTable.isPublished,
        published_at: newsTable.publishedAt,
        views: newsTable.views,
        created_at: newsTable.createdAt,
      })
      .from(newsTable)
      .leftJoin(adminUsers, eq(newsTable.authorId, adminUsers.id))
      .where(and(...filters))
      .orderBy(desc(newsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return ResponseWrapper.success(news, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return ResponseWrapper.serverError('Error fetching news', error);
  }
}

// POST - Create news
/**
 * API Tạo tin tức mới.
 * Chức năng:
 * 1. Tự động chuẩn hóa Tiêu đề thành Slug (URL friendly).
 * 2. Sanitize nội dung HTML để ngăn chặn tấn công XSS.
 * 3. Ghi nhận thời gian xuất bản nếu đặt trạng thái là Published.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { title, excerpt, image_url, category, is_published } = body;
    const content = sanitizeRichContent(body.content || '');

    if (!title || !content) {
      return ResponseWrapper.error('Title and content are required', 400);
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const publishedAt = is_published ? new Date() : null;

    const [result] = await db.insert(newsTable).values({
      title,
      slug,
      excerpt,
      content,
      imageUrl: image_url,
      category,
      authorId: admin.userId,
      isPublished: is_published ? 1 : 0,
      publishedAt,
    });

    return ResponseWrapper.success({ id: result.insertId }, 'News created successfully', 201);
  } catch (error: any) {
    console.error('Error creating news:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return ResponseWrapper.error('A news article with this title already exists', 400);
    }
    return ResponseWrapper.serverError('Error creating news', error);
  }
}
