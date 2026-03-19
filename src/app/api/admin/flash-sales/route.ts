import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { flashSales as flashSalesTable } from '@/lib/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import { invalidateCache } from '@/lib/redis/cache';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý chương trình Flash Sale (Admin).
 * Chức năng:
 * - GET: Liệt kê danh sách tất cả các đợt Flash Sale (đã tạo, chưa xóa).
 * - POST: Tạo mới một chương trình Flash Sale với thời gian bắt đầu/kết thúc cụ thể.
 * Bảo mật: Yêu cầu quyền Admin.
 */

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const flashSalesData = await db
      .select({
        id: flashSalesTable.id,
        name: flashSalesTable.name,
        description: flashSalesTable.description,
        start_time: flashSalesTable.startTime,
        end_time: flashSalesTable.endTime,
        is_active: flashSalesTable.isActive,
        created_at: flashSalesTable.createdAt,
        updated_at: flashSalesTable.updatedAt,
      })
      .from(flashSalesTable)
      .where(isNull(flashSalesTable.deletedAt))
      .orderBy(desc(flashSalesTable.createdAt));

    return ResponseWrapper.success(flashSalesData);
  } catch (error) {
    console.error('List flash sales error:', error);
    return ResponseWrapper.serverError('Lỗi server khi tải danh sách Flash Sale', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { name, description, start_time, startTime, end_time, endTime, is_active, isActive } =
      body;

    const finalStart = start_time || startTime;
    const finalEnd = end_time || endTime;
    const finalIsActive = is_active !== undefined ? is_active : isActive;

    if (!name || !finalStart || !finalEnd) {
      return ResponseWrapper.error('Thiếu các trường bắt buộc (name, startTime, endTime)', 400);
    }

    if (new Date(finalStart) >= new Date(finalEnd)) {
      return ResponseWrapper.error('Thời gian kết thúc phải sau thời gian bắt đầu', 400);
    }

    const [result] = await db.insert(flashSalesTable).values({
      name,
      description: description || null,
      startTime: new Date(finalStart),
      endTime: new Date(finalEnd),
      isActive: finalIsActive !== undefined ? (finalIsActive ? 1 : 0) : 1,
    });

    const insertId = (result as any).insertId;

    // Log audit
    await logAdminAction(
      admin.userId,
      'create_flash_sale',
      'flash_sales',
      insertId,
      null,
      { name },
      request
    );

    // Invalidate active flash sale cache
    await invalidateCache('flash-sale:active');

    const responseData = { id: insertId };

    return ResponseWrapper.success(responseData, 'Đã tạo chương trình Flash Sale thành công');
  } catch (error) {
    console.error('Create flash sale error:', error);
    return ResponseWrapper.serverError('Lỗi server khi tạo Flash Sale', error);
  }
}
