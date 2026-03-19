import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { warehouses as warehousesTable } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET /api/admin/warehouses - List all warehouses
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const warehouses = await db.select().from(warehousesTable).orderBy(asc(warehousesTable.id));

    return ResponseWrapper.success(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * POST /api/admin/warehouses - Create new warehouse
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { name, location } = body;

    if (!name) {
      return ResponseWrapper.error('Tên kho là bắt buộc', 400);
    }

    const [result] = await db.insert(warehousesTable).values({
      name,
      address: location || null,
    });
    const insertId = Number(result.insertId);

    await logAdminAction(
      admin.userId,
      'CREATE_WAREHOUSE',
      'warehouses',
      insertId,
      null,
      { name, location },
      request
    );

    return ResponseWrapper.success(
      { id: insertId, name, address: location },
      'Thêm kho thành công',
      201
    );
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
