
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

// GET - Lấy tất cả banners (Admin)
export async function GET(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const position = searchParams.get('position');

        let query = 'SELECT * FROM banners';
        const params: any[] = [];

        if (position) {
            query += ' WHERE position = ?';
            params.push(position);
        }

        query += ' ORDER BY display_order ASC, created_at DESC';

        const banners = await executeQuery<any[]>(query, params);

        return NextResponse.json({
            success: true,
            data: banners
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

// POST - Tạo banner mới
export async function POST(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title,
            description,
            image_url,
            mobile_image_url,
            link_url,
            link_text,
            position,
            display_order,
            start_date,
            end_date,
            is_active
        } = body;

        if (!title || !image_url) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await executeQuery(
            `INSERT INTO banners 
       (title, description, image_url, mobile_image_url, link_url, link_text, position, display_order, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                description || '',
                image_url,
                mobile_image_url || null,
                link_url || null,
                link_text || null,
                position || 'homepage',
                display_order || 0,
                start_date || null,
                end_date || null,
                is_active !== undefined ? is_active : 1
            ]
        );

        return NextResponse.json({ success: true, message: 'Banner created successfully' });
    } catch (error) {
        console.error('Error creating banner:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Cập nhật banner
export async function PUT(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing banner ID' }, { status: 400 });
        }

        const allowedFields = [
            'title', 'description', 'image_url', 'mobile_image_url',
            'link_url', 'link_text', 'position', 'display_order',
            'start_date', 'end_date', 'is_active'
        ];

        const updateFields: string[] = [];
        const updateValues: any[] = [];

        Object.keys(updates).forEach((key) => {
            if (allowedFields.includes(key)) {
                let value = updates[key];
                if ((key === 'start_date' || key === 'end_date') && value === '') {
                    value = null;
                }
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        });

        if (updateFields.length === 0) {
            return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
        }

        updateValues.push(id);

        await executeQuery(
            `UPDATE banners SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        return NextResponse.json({ success: true, message: 'Banner updated successfully' });
    } catch (error) {
        console.error('Error updating banner:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Xóa banner
export async function DELETE(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing banner ID' }, { status: 400 });
        }

        await executeQuery('DELETE FROM banners WHERE id = ?', [id]);

        return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
