import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { categories as categoriesTable } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { invalidateCache } from '@/lib/redis/cache';

const CATEGORIES_CACHE_KEY = 'global:categories';

/**
 * API Cập nhật thông tin danh mục.
 * Logic: So sánh dữ liệu cũ và mới để ghi nhận các trường đã thay đổi vào Audit Log.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = Number(id);

  try {
    // Get current state
    const [currentCategory] = await db
      .select({
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
        imageUrl: categoriesTable.imageUrl,
        position: categoriesTable.position,
      })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .limit(1);

    if (!currentCategory) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, description, image_url, imageUrl, position } = body;
    const finalImageUrl = image_url || imageUrl || null;

    await db
      .update(categoriesTable)
      .set({
        name,
        slug,
        description,
        imageUrl: finalImageUrl,
        position: position !== undefined ? Number(position) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(categoriesTable.id, categoryId));

    // Invalidate public categories cache
    await invalidateCache(CATEGORIES_CACHE_KEY);

    // Filter changes for audit log
    const updates: any = { name, slug, description, imageUrl: finalImageUrl, position };
    const oldValues: any = {};
    const newValues: any = {};

    Object.keys(updates).forEach((key) => {
      if (
        updates[key] !== undefined &&
        JSON.stringify(currentCategory[key as keyof typeof currentCategory]) !==
          JSON.stringify(updates[key])
      ) {
        oldValues[key] = currentCategory[key as keyof typeof currentCategory];
        newValues[key] = updates[key];
      }
    });

    // Log audit
    if (Object.keys(newValues).length > 0) {
      await logAdminAction(
        admin.userId,
        'UPDATE_CATEGORY',
        'categories',
        id,
        oldValues,
        newValues,
        request
      );
    }

    return NextResponse.json({ success: true, message: 'Category updated' });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating category' },
      { status: 500 }
    );
  }
}

/**
 * API Xóa danh mục (Soft Delete).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = Number(id);

  try {
    await db
      .update(categoriesTable)
      .set({ deletedAt: new Date() })
      .where(eq(categoriesTable.id, categoryId));

    // Invalidate public categories cache
    await invalidateCache(CATEGORIES_CACHE_KEY);

    // Log audit
    await logAdminAction(
      admin.userId,
      'DELETE_CATEGORY',
      'categories',
      id,
      { is_active: 1 },
      { is_active: 0 },
      request
    );

    return NextResponse.json({ success: true, message: 'Category deleted (soft delete)' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting category' },
      { status: 500 }
    );
  }
}
