import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API Lấy danh sách câu hỏi thường gặp (FAQs) và danh mục FAQ.
 * Hỗ trợ lọc theo categoryId và tự động sắp xếp theo vị trí hiển thị đã cấu hình.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');

    let query = `
      SELECT 
        f.id,
        f.question,
        f.answer,
        f.helpful_count,
        fc.id as category_id,
        fc.name as category_name,
        fc.slug as category_slug
      FROM faqs f
      JOIN faq_categories fc ON f.category_id = fc.id
      WHERE f.is_active = 1 AND fc.is_active = 1
    `;

    const params: any[] = [];

    if (categoryId) {
      query += ' AND f.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY fc.position, f.position';

    const faqs = await executeQuery(query, params);

    // Lấy danh sách categories
    const categories = await executeQuery(`
      SELECT id, name, slug, description, icon
      FROM faq_categories
      WHERE is_active = 1
      ORDER BY position
    `);

    return NextResponse.json({
      success: true,
      data: {
        faqs,
        categories
      }
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Không thể tải danh sách câu hỏi'
      },
      { status: 500 }
    );
  }
}
