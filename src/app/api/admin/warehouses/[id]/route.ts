import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

// PUT /api/admin/warehouses/[id] - Update warehouse
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;
        const body = await request.json();
        const { name, location, is_active } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (location !== undefined) {
            updates.push('location = ?');
            values.push(location);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Không có dữ liệu cập nhật' },
                { status: 400 }
            );
        }

        values.push(id);

        await executeQuery(
            `UPDATE warehouses SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return NextResponse.json({
            success: true,
            message: 'Cập nhật kho thành công'
        });
    } catch (error) {
        console.error('Error updating warehouse:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server nội bộ' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/warehouses/[id] - Delete (or soft delete) warehouse
// Note: We generally shouldn't delete warehouses if they have inventory/orders.
// For now, we'll allow deletion but DB FK constraints might block it if used.
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;

        // Check if warehouse has inventory
        const [inv] = await executeQuery<any[]>(
            'SELECT count(*) as count FROM inventory WHERE warehouse_id = ?',
            [id]
        );

        if (inv && inv.count > 0) {
            return NextResponse.json(
                { success: false, message: 'Không thể xóa kho đang có hàng tồn. Hãy chuyển hàng hoặc ẩn kho.' },
                { status: 400 }
            );
        }

        await executeQuery('DELETE FROM warehouses WHERE id = ?', [id]);

        return NextResponse.json({
            success: true,
            message: 'Xóa kho thành công'
        });
    } catch (error) {
        console.error('Error deleting warehouse:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server nội bộ' },
            { status: 500 }
        );
    }
}
