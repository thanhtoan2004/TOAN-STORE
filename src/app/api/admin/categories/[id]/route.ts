import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/security/audit';
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
  try {
    // Get current state
    const currentCategories = await executeQuery<any[]>(
      'SELECT name, slug, description, image_url, position FROM categories WHERE id = ?',
      [id]
    );
    const currentCategory = currentCategories[0];

    const { name, slug, description, image_url, position } = await request.json();

    await executeQuery(
      'UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, position = ? WHERE id = ?',
      [name, slug, description, image_url || null, position, id]
    );

    // Invalidate public categories cache
    await invalidateCache(CATEGORIES_CACHE_KEY);

    // Filter changes for audit log
    const updates = { name, slug, description, image_url, position };
    const oldValues: any = {};
    const newValues: any = {};

    if (currentCategory) {
      Object.keys(updates).forEach((key) => {
        if (
          updates[key as keyof typeof updates] !== undefined &&
          JSON.stringify(currentCategory[key]) !==
            JSON.stringify(updates[key as keyof typeof updates])
        ) {
          oldValues[key] = currentCategory[key];
          newValues[key] = updates[key as keyof typeof updates];
        }
      });
    }

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

  try {
    await executeQuery('UPDATE categories SET deleted_at = NOW() WHERE id = ?', [id]);

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
