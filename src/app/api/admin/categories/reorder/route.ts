import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API Sắp xếp lại thứ tự Danh mục (Drag & Drop Reorder)
 * 
 * Bảo mật:
 * - Yêu cầu xác thực Admin (checkAdminAuth).
 * - Validate đầu vào: kiểm tra items là mảng hợp lệ, giới hạn tối đa 100 items.
 * - Validate từng item: id phải là số dương, position phải là số không âm.
 * - Sử dụng parameterized query để chống SQL Injection.
 * 
 * Tối ưu:
 * - Chấp nhận batch update thay vì từng item một (giảm số lượng request từ client).
 * - Dùng vòng lặp UPDATE riêng cho từng hàng (an toàn hơn UPDATE CASE/WHEN
 *   vì số lượng danh mục thường nhỏ, không cần tối ưu quá mức).
 */

/** Giới hạn số danh mục tối đa trong 1 request (phòng chống abuse) */
const MAX_ITEMS = 100;

/**
 * PUT - Cập nhật hàng loạt vị trí (position) của các danh mục.
 * 
 * Body: { items: [{ id: number, position: number }] }
 * 
 * Client gửi toàn bộ thứ tự mới sau khi kéo thả, server cập nhật
 * cột `position` trong bảng `categories` cho từng danh mục.
 */
export async function PUT(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { items } = body;

        // Validate mảng đầu vào
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Danh sách items không hợp lệ' },
                { status: 400 }
            );
        }

        // Giới hạn số lượng items (phòng chống gửi mảng quá lớn)
        if (items.length > MAX_ITEMS) {
            return NextResponse.json(
                { success: false, message: `Tối đa ${MAX_ITEMS} danh mục/lần` },
                { status: 400 }
            );
        }

        let updatedCount = 0;

        // Cập nhật từng danh mục (số lượng thường nhỏ nên chấp nhận được)
        for (const item of items) {
            const id = Number(item.id);
            const position = Number(item.position);

            // Validate từng item: id > 0 và position >= 0
            if (!id || id <= 0 || !Number.isInteger(id)) continue;
            if (isNaN(position) || position < 0 || !Number.isInteger(position)) continue;

            await executeQuery(
                'UPDATE categories SET position = ? WHERE id = ? AND deleted_at IS NULL',
                [position, id]
            );
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Đã cập nhật thứ tự cho ${updatedCount} danh mục`
        });
    } catch (error) {
        console.error('[Reorder] Lỗi khi sắp xếp danh mục:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi khi cập nhật thứ tự danh mục' },
            { status: 500 }
        );
    }
}
