import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { categories } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * API Sắp xếp lại thứ tự Danh mục (Drag & Drop Reorder)
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

    // Cập nhật từng danh mục trong transaction
    await db.transaction(async (tx) => {
      for (const item of items) {
        const id = Number(item.id);
        const position = Number(item.position);

        // Validate từng item: id > 0 và position >= 0
        if (!id || id <= 0 || !Number.isInteger(id)) continue;
        if (isNaN(position) || position < 0 || !Number.isInteger(position)) continue;

        await tx
          .update(categories)
          .set({ position })
          .where(and(eq(categories.id, id), isNull(categories.deletedAt)));
        updatedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật thứ tự cho ${updatedCount} danh mục`,
    });
  } catch (error) {
    console.error('[Reorder] Lỗi khi sắp xếp danh mục:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi cập nhật thứ tự danh mục' },
      { status: 500 }
    );
  }
}
