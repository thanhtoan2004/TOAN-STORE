import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// GET - Public news list
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const category = searchParams.get('category') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const offset = (page - 1) * limit;

        let whereConditions = ['is_published = 1'];
        let queryParams: any[] = [];

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

        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM news WHERE ${whereClause}
    `, queryParams) as any[];

        return NextResponse.json({
            success: true,
            data: {
                news,
                pagination: {
                    page,
                    limit,
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching public news:', error);
        return NextResponse.json({ success: false, message: 'Error fetching news' }, { status: 500 });
    }
}
