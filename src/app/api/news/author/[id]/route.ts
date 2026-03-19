import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { adminUsers, news as newsTable, roles } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Hồ sơ Tác giả Blog (Author Profile)
 *
 * Bảo mật:
 * - Đây là API công khai (không yêu cầu đăng nhập) vì trang hồ sơ tác giả
 *   hiển thị cho tất cả người dùng.
 * - KHÔNG trả về email, password, hoặc bất kỳ thông tin nhạy cảm nào.
 * - Chỉ hiển thị Admin đang active (is_active = 1).
 * - Chỉ hiển thị bài viết đã xuất bản (is_published = 1).
 * - Validate: id phải là số nguyên dương.
 *
 * Dữ liệu trả về:
 * - Thông tin tác giả: tên, username, avatar, bio, role.
 * - Danh sách bài viết đã xuất bản, sắp xếp mới nhất đầu tiên.
 */

/**
 * GET - Lấy thông tin tác giả và danh sách bài viết.
 *
 * Tác giả (author) là Admin user, được liên kết qua cột author_id trong bảng news.
 * Trang này cho phép độc giả xem hồ sơ và tất cả bài viết của một tác giả cụ thể.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate ID: phải là số nguyên dương
    const authorId = Number(id);
    if (!authorId || !Number.isInteger(authorId) || authorId <= 0) {
      return ResponseWrapper.error('ID tác giả không hợp lệ', 400);
    }

    // Lấy thông tin tác giả (CHỈ các trường công khai, KHÔNG có email/password)
    const [author] = await db
      .select({
        id: adminUsers.id,
        fullName: adminUsers.fullName,
        username: adminUsers.username,
        avatarUrl: adminUsers.avatarUrl,
        bio: adminUsers.bio,
        role: roles.name,
      })
      .from(adminUsers)
      .leftJoin(roles, eq(adminUsers.roleId, roles.id))
      .where(and(eq(adminUsers.id, authorId), eq(adminUsers.isActive, 1)))
      .limit(1);

    if (!author) {
      return ResponseWrapper.notFound('Không tìm thấy tác giả');
    }

    // Lấy danh sách bài viết ĐÃ XUẤT BẢN của tác giả (không hiển thị bài nháp)
    const articles = await db
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
      .where(and(eq(newsTable.authorId, authorId), eq(newsTable.isPublished, 1)))
      .orderBy(desc(newsTable.publishedAt));

    return ResponseWrapper.success({
      author,
      articles,
    });
  } catch (error) {
    console.error('[Author Profile] Lỗi khi tải hồ sơ tác giả:', error);
    return ResponseWrapper.serverError('Lỗi hệ thống', error);
  }
}
