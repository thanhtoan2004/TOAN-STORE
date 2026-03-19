import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { attributes as attributesTable } from '@/lib/db/schema';
import { checkAdminAuth } from '@/lib/auth/auth';
import { eq, and, asc } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy danh sách toàn bộ thuộc tính sản phẩm (Size, Color, Material, v.v.).
 */
export async function GET() {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const attributes = await db
      .select({
        id: attributesTable.id,
        name: attributesTable.name,
        slug: attributesTable.slug,
        type: attributesTable.type,
        is_filterable: attributesTable.isFilterable,
        created_at: attributesTable.createdAt,
      })
      .from(attributesTable)
      .orderBy(asc(attributesTable.name));

    return ResponseWrapper.success(attributes);
  } catch (error) {
    console.error('Attributes Get Error:', error);
    return ResponseWrapper.serverError('Server error', error);
  }
}

/**
 * API Tạo mới một loại thuộc tính.
 */
export async function POST(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { name, slug, type, is_filterable } = await request.json();

    const [result] = await db.insert(attributesTable).values({
      name,
      slug,
      type,
      isFilterable: is_filterable ? 1 : 0,
    });

    return ResponseWrapper.success({ id: result.insertId }, 'Attribute created successfully', 201);
  } catch (error) {
    console.error('Attribute Create Error:', error);
    return ResponseWrapper.serverError('Server error', error);
  }
}
