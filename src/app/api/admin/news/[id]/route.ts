import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

// PUT - Update news
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { title, excerpt, content, image_url, category, is_published } = body;

        if (!title || !content) {
            return NextResponse.json({ success: false, message: 'Title and content are required' }, { status: 400 });
        }

        // Generate slug from title
        const slug = title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // If changing to published and not published before, set published_at
        const existing = await executeQuery('SELECT is_published, published_at FROM news WHERE id = ?', [id]) as any[];

        let published_at = existing[0]?.published_at;
        if (is_published && !existing[0]?.is_published) {
            published_at = new Date();
        } else if (!is_published) {
            published_at = null;
        }

        await executeQuery(`
      UPDATE news 
      SET title = ?, slug = ?, excerpt = ?, content = ?, image_url = ?, category = ?, 
          is_published = ?, published_at = ?
      WHERE id = ?
    `, [title, slug, excerpt, content, image_url, category, is_published ? 1 : 0, published_at, id]);

        return NextResponse.json({
            success: true,
            message: 'News updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating news:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ success: false, message: 'A news article with this title already exists' }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: 'Error updating news' }, { status: 500 });
    }
}

// DELETE - Delete news
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        await executeQuery('DELETE FROM news WHERE id = ?', [id]);

        return NextResponse.json({
            success: true,
            message: 'News deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting news:', error);
        return NextResponse.json({ success: false, message: 'Error deleting news' }, { status: 500 });
    }
}
