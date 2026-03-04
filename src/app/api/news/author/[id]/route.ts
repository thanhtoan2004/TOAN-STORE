import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

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
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validate ID: phải là số nguyên dương
        const authorId = Number(id);
        if (!authorId || !Number.isInteger(authorId) || authorId <= 0) {
            return NextResponse.json(
                { success: false, message: 'ID tác giả không hợp lệ' },
                { status: 400 }
            );
        }

        // Lấy thông tin tác giả (CHỈ các trường công khai, KHÔNG có email/password)
        const [author] = await executeQuery(`
      SELECT 
        id, full_name, username,
        avatar_url, bio, role
      FROM admin_users
      WHERE id = ? AND is_active = 1
    `, [authorId]) as any[];

        if (!author) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy tác giả' },
                { status: 404 }
            );
        }

        // Lấy danh sách bài viết ĐÃ XUẤT BẢN của tác giả (không hiển thị bài nháp)
        const articles = await executeQuery(`
      SELECT 
        id, title, slug, excerpt, image_url, 
        category, published_at, views
      FROM news
      WHERE author_id = ? AND is_published = 1
      ORDER BY published_at DESC
    `, [authorId]) as any[];

        return NextResponse.json({
            success: true,
            data: {
                author,
                articles
            }
        });
    } catch (error) {
        console.error('[Author Profile] Lỗi khi tải hồ sơ tác giả:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi hệ thống' },
            { status: 500 }
        );
    }
}
