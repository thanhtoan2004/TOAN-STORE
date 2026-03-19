import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { warehouses as warehousesTable, inventory } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * PUT /api/admin/warehouses/[id] - Update warehouse
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    const body = await request.json();
    const { name, location, is_active } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (location !== undefined) updateData.address = location; // Fixed: warehouses table uses 'address', not 'location'
    if (is_active !== undefined) updateData.isActive = is_active ? 1 : 0;

    if (Object.keys(updateData).length === 0) {
      return ResponseWrapper.error('Không có dữ liệu cập nhật', 400);
    }

    await db.update(warehousesTable).set(updateData).where(eq(warehousesTable.id, id));

    await logAdminAction(
      admin.userId,
      'UPDATE_WAREHOUSE',
      'warehouses',
      id,
      null,
      updateData,
      request
    );

    return ResponseWrapper.success(null, 'Cập nhật kho thành công');
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * DELETE /api/admin/warehouses/[id] - Delete warehouse
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: paramId } = await params;
    const id = Number(paramId);

    // Check if warehouse has inventory
    const [inv] = await db
      .select({ total: count() })
      .from(inventory)
      .where(eq(inventory.warehouseId, id));

    if (inv && inv.total > 0) {
      return ResponseWrapper.error(
        'Không thể xóa kho đang có hàng tồn. Hãy chuyển hàng hoặc ẩn kho.',
        400
      );
    }

    await db.delete(warehousesTable).where(eq(warehousesTable.id, id));

    await logAdminAction(
      admin.userId,
      'DELETE_WAREHOUSE',
      'warehouses',
      id,
      null,
      { deleted: true },
      request
    );

    return ResponseWrapper.success(null, 'Xóa kho thành công');
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
