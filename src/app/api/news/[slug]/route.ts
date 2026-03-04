import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// GET - Get news by slug
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const result = await executeQuery(`
      SELECT 
        n.*,
        n.author_id,
        au.full_name as author_name
      FROM news n
      LEFT JOIN admin_users au ON n.author_id = au.id
      WHERE n.slug = ? AND n.is_published = 1
    `, [slug]) as any[];

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, message: 'News not found' },
                { status: 404 }
            );
        }

        // Increment view count
        await executeQuery('UPDATE news SET views = views + 1 WHERE slug = ?', [slug]);

        return NextResponse.json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error fetching news detail:', error);
        return NextResponse.json(
            { success: false, message: 'Error fetching news' },
            { status: 500 }
        );
    }
}
