import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

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

        const whereConditions = ['is_published = 1'];
        const queryParams: any[] = [];

        if (category) {
            whereConditions.push('category = ?');
            queryParams.push(category);
        }

        const whereClause = whereConditions.join(' AND ');

        const news = await executeQuery(`
      SELECT 
        id, title, slug, excerpt, image_url, category, published_at, views
      FROM news
      WHERE ${whereClause}
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

        const [countRow] = await executeQuery(`
      SELECT COUNT(*) as total FROM news WHERE ${whereClause}
    `, queryParams) as any[];

        return NextResponse.json({
            success: true,
            data: {
                news,
                pagination: {
                    page,
                    limit,
                    total: countRow?.total || 0,
                    totalPages: Math.ceil((countRow?.total || 0) / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching public news:', error);
        return NextResponse.json({ success: false, message: 'Error fetching news' }, { status: 500 });
    }
}
