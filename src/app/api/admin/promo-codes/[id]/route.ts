import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { invalidateCache } from '@/lib/cache';
import { checkAdminAuth } from '@/lib/auth';

// PUT - Cập nhật coupon theo ID
/**
 * API Cập nhật mã giảm giá (Partial Update).
 * Tự động xóa cache danh sách ưu đãi công khai sau khi thay đổi.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Thiếu ID mã giảm giá' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const updates = body;

        // Build update query dynamically
        const allowedFields = [
            'description',
            'discount_type',
            'discount_value',
            'min_order_amount',
            'max_discount_amount',
            'starts_at',
            'ends_at',
            'usage_limit',
            'usage_limit_per_user'
        ];

        const updateFields: string[] = [];
        const updateValues: any[] = [];

        Object.keys(updates).forEach((key) => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Không có trường nào để cập nhật' },
                { status: 400 }
            );
        }

        updateValues.push(id);

        await executeQuery(
            `UPDATE coupons SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Invalidate cache
        await invalidateCache('promo-codes:available');

        return NextResponse.json({
            success: true,
            message: 'Cập nhật mã giảm giá thành công'
        });
    } catch (error) {
        console.error('Error updating coupon:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server nội bộ' },
            { status: 500 }
        );
    }
}

// DELETE - Xóa coupon theo ID
/**
 * API Xóa mã giảm giá (Soft Delete).
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

        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Thiếu ID mã giảm giá' },
                { status: 400 }
            );
        }

        // Soft delete
        await executeQuery('UPDATE coupons SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

        // Invalidate cache
        await invalidateCache('promo-codes:available');

        return NextResponse.json({
            success: true,
            message: 'Xóa mã giảm giá thành công'
        });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server nội bộ' },
            { status: 500 }
        );
    }
}
