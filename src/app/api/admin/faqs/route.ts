import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';
import { sanitizeRichContent } from '@/lib/sanitize';

/**
 * API Lấy danh sách câu hỏi thường gặp (FAQs).
 * Phân trang và sắp xếp theo vị trí ưu tiên (position).
 */
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const faqs = await executeQuery(
      `SELECT * FROM faqs ORDER BY position ASC, created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];

    const [countRow] = await executeQuery(`SELECT COUNT(*) as total FROM faqs`) as any[];
    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: faqs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching FAQs' },
      { status: 500 }
    );
  }
}

/**
 * API Tạo mới câu hỏi thường gặp.
 * Bảo mật: Làm sạch nội dung HTML (Sanitize) để phòng chống XSS trước khi lưu vào DB.
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { question, category_id, position } = body;
    const answer = sanitizeRichContent(body.answer || '');

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, message: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO faqs (question, answer, category_id, position, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [question, answer, category_id || 1, position || 0]
    ) as any;

    return NextResponse.json({
      success: true,
      message: 'FAQ created successfully',
      data: { id: result.insertId, question, answer, category_id, position }
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating FAQ' },
      { status: 500 }
    );
  }
}

/**
 * API Cập nhật câu hỏi thường gặp.
 */
export async function PUT(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, question, category_id, position, is_active } = body;
    const answer = sanitizeRichContent(body.answer || '');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }

    await executeQuery(
      `UPDATE faqs SET question = ?, answer = ?, category_id = ?, position = ?, is_active = ?, updated_at = NOW() 
       WHERE id = ?`,
      [question, answer, category_id || 1, position || 0, is_active !== undefined ? (is_active ? 1 : 0) : 1, id]
    );

    return NextResponse.json({
      success: true,
      message: 'FAQ updated successfully'
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating FAQ' },
      { status: 500 }
    );
  }
}

/**
 * API Xóa vĩnh viễn câu hỏi thường gặp.
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }

    await executeQuery(`DELETE FROM faqs WHERE id = ?`, [id]);

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting FAQ' },
      { status: 500 }
    );
  }
}
