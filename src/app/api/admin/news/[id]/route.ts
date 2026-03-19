import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { news as newsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { sanitizeRichContent } from '@/lib/security/sanitize';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Cập nhật nội dung bài viết tin tức (Admin).
 * Chức năng:
 * - Cập nhật thông tin bài viết (Tiêu đề, Trích dẫn, Nội dung, Ảnh đại diện, Danh mục).
 * - Tự động tạo slug từ tiêu đề.
 * - Xử lý trạng thái Xuất bản (Published) và ngày xuất bản tương ứng.
 * - Tự động làm sạch mã HTML (Sanitize) để phòng chống XSS.
 * Bảo mật: Yêu cầu quyền Admin.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id } = await params;
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

    // 1. Get existing to check publish status
    const [existing] = await db
      .select({ isPublished: newsTable.isPublished, publishedAt: newsTable.publishedAt })
      .from(newsTable)
      .where(eq(newsTable.id, Number(id)))
      .limit(1);

    if (!existing) {
      return ResponseWrapper.notFound('Không tìm thấy bài viết tin tức');
    }

    let publishedAt = existing.publishedAt;
    if (is_published && !existing.isPublished) {
      publishedAt = new Date();
    } else if (!is_published) {
      publishedAt = null;
    }

    // 2. Update news using Drizzle
    await db
      .update(newsTable)
      .set({
        title,
        slug,
        excerpt,
        content,
        imageUrl: image_url,
        category,
        isPublished: is_published ? 1 : 0,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(newsTable.id, Number(id)));

    return ResponseWrapper.success(null, 'News updated successfully');
  } catch (error: any) {
    console.error('Error updating news:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return ResponseWrapper.error('A news article with this title already exists', 400);
    }
    return ResponseWrapper.serverError('Lỗi server khi cập nhật bài viết', error);
  }
}

/**
 * API Xóa vĩnh viễn bài viết tin tức (Admin).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id } = await params;

    const [result] = await db.delete(newsTable).where(eq(newsTable.id, Number(id)));

    if (result.affectedRows === 0) {
      return ResponseWrapper.notFound('Không tìm thấy bài viết để thực hiện xóa');
    }

    return ResponseWrapper.success(null, 'News deleted successfully');
  } catch (error) {
    console.error('Error deleting news:', error);
    return ResponseWrapper.serverError('Lỗi server khi xóa bài viết', error);
  }
}
