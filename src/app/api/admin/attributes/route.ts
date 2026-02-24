import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getAllAttributes } from '@/lib/db/repositories/attribute';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API Lấy danh sách toàn bộ thuộc tính sản phẩm (Size, Color, Material, v.v.).
 */
export async function GET() {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const attributes = await getAllAttributes();
        return NextResponse.json({ success: true, attributes });
    } catch (error) {
        console.error('Attributes Get Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

/**
 * API Tạo mới một loại thuộc tính.
 */
export async function POST(request: Request) {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, slug, type, is_filterable } = await request.json();
        const result = await executeQuery<any>(
            'INSERT INTO attributes (name, slug, type, is_filterable) VALUES (?, ?, ?, ?)',
            [name, slug, type, is_filterable ? 1 : 0]
        );
        return NextResponse.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Attribute Create Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
