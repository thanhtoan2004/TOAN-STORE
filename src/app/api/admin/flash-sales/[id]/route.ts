import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';
import { formatDateForMySQL } from '@/lib/date-utils';
import { logAdminAction } from '@/lib/audit';
import { invalidateCache } from '@/lib/cache';

/**
 * GET - Get individual flash sale detail for admin
 */
/**
 * API Lấy chi tiết một đợt Flash Sale kèm danh sách sản phẩm tham gia.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = (await params).id;

        const [flashSale] = await executeQuery<any[]>(
            `SELECT * FROM flash_sales WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        if (!flashSale) {
            return NextResponse.json({ success: false, message: 'Flash sale not found' }, { status: 404 });
        }

        const items = await executeQuery<any[]>(
            `SELECT fsi.*, p.name as product_name, p.sku as product_sku 
             FROM flash_sale_items fsi
             JOIN products p ON fsi.product_id = p.id
             WHERE fsi.flash_sale_id = ?`,
            [id]
        );

        return NextResponse.json({
            success: true,
            data: {
                ...flashSale,
                items
            }
        });
    } catch (error) {
        console.error('Get flash sale error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH - Update flash sale
 */
/**
 * API Cập nhật thông tin đợt Flash Sale (Tên, Mô tả, Thời gian).
 * Tự động xóa Cache public sau khi cập nhật.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = (await params).id;
        const body = await request.json();
        const { name, description, startTime, endTime, isActive } = body;

        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (startTime !== undefined) { updates.push('start_time = ?'); values.push(formatDateForMySQL(startTime)); }
        if (endTime !== undefined) { updates.push('end_time = ?'); values.push(formatDateForMySQL(endTime)); }
        if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive); }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
        }

        values.push(id);
        await executeQuery(
            `UPDATE flash_sales SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Log audit
        await logAdminAction(admin.userId, 'update_flash_sale', 'flash_sales', id, { name, isActive }, request as any);

        // Invalidate active flash sale cache
        await invalidateCache('flash-sale:active');

        return NextResponse.json({ success: true, message: 'Flash sale updated' });
    } catch (error) {
        console.error('Update flash sale error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Delete flash sale
 */
/**
 * API Xóa đợt Flash Sale (Soft Delete).
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = (await params).id;

        await executeQuery(
            `UPDATE flash_sales SET deleted_at = NOW() WHERE id = ?`,
            [id]
        );

        // Log audit
        await logAdminAction(admin.userId, 'soft_delete_flash_sale', 'flash_sales', id, null, request as any);

        // Invalidate active flash sale cache
        await invalidateCache('flash-sale:active');

        return NextResponse.json({ success: true, message: 'Flash sale deleted' });
    } catch (error) {
        console.error('Delete flash sale error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
