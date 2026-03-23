import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { faqs as faqsTable } from '@/lib/db/schema';
import { eq, desc, asc, count } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { sanitizeRichContent } from '@/lib/security/sanitize';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý danh sách Câu hỏi thường gặp (FAQs) - Admin.
 * Chức năng:
 * - GET: Liệt kê danh sách FAQ (Paginated, sắp xếp theo vị trí).
 * - POST: Tạo mới FAQ (Sanitize nội dung HTML).
 * - PUT: Cập nhật thông tin FAQ theo ID.
 * - DELETE: Xóa vĩnh viễn FAQ theo ID.
 * Bảo mật: Yêu cầu quyền Admin.
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
    const offset = (page - 1) * limit;

    const faqsData = await db
      .select()
      .from(faqsTable)
      .orderBy(asc(faqsTable.position), desc(faqsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(faqsTable);

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return ResponseWrapper.success(faqsData, undefined, 200, pagination);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return ResponseWrapper.serverError('Lỗi server khi tải danh sách FAQ', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { question, category_id, categoryId, position, is_active, isActive } = body;
    const answer = sanitizeRichContent(body.answer || '');

    if (!question || !answer) {
      return ResponseWrapper.error('Câu hỏi và câu trả lời là bắt buộc', 400);
    }

    const [result] = await db.insert(faqsTable).values({
      question,
      answer,
      categoryId: categoryId || category_id || 1,
      position: position || 0,
      isActive:
        isActive !== undefined
          ? isActive
            ? 1
            : 0
          : is_active !== undefined
            ? is_active
              ? 1
              : 0
            : 1,
    });

    const insertId = (result as any).insertId;

    const responseData = {
      id: insertId,
      question,
      answer,
      categoryId: categoryId || category_id,
      position,
      isActive:
        isActive !== undefined
          ? isActive
            ? 1
            : 0
          : is_active !== undefined
            ? is_active
              ? 1
              : 0
            : 1,
    };

    return ResponseWrapper.success(responseData, 'Đã tạo FAQ thành công');
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return ResponseWrapper.serverError('Lỗi server khi tạo FAQ', error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { id, question, category_id, categoryId, position, is_active, isActive } = body;
    const answer = sanitizeRichContent(body.answer || '');

    if (!id) {
      return ResponseWrapper.error('ID là bắt buộc để cập nhật', 400);
    }

    // Determine values for either snake_case or camelCase to be safe
    const finalIsActive =
      isActive !== undefined
        ? isActive
          ? 1
          : 0
        : is_active !== undefined
          ? is_active
            ? 1
            : 0
          : undefined;

    const [updateResult] = await db
      .update(faqsTable)
      .set({
        question,
        answer,
        categoryId: categoryId || category_id || 1,
        position: position || 0,
        ...(finalIsActive !== undefined && { isActive: finalIsActive }),
        updatedAt: new Date(),
      })
      .where(eq(faqsTable.id, id));

    if (updateResult.affectedRows === 0) {
      return ResponseWrapper.notFound('Không tìm thấy FAQ để cập nhật');
    }

    return ResponseWrapper.success(null, 'Đã cập nhật FAQ thành công');
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return ResponseWrapper.serverError('Lỗi server khi cập nhật FAQ', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ResponseWrapper.error('ID là bắt buộc để xóa', 400);
    }

    const [deleteResult] = await db.delete(faqsTable).where(eq(faqsTable.id, parseInt(id)));

    if (deleteResult.affectedRows === 0) {
      return ResponseWrapper.notFound('Không tìm thấy FAQ để xóa');
    }

    return ResponseWrapper.success(null, 'Đã xóa FAQ thành công');
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return ResponseWrapper.serverError('Lỗi server khi xóa FAQ', error);
  }
}
