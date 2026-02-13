import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { name, slug, description, image_url, position } = await request.json();

    await executeQuery(
      'UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, position = ? WHERE id = ?',
      [name, slug, description, image_url || null, position, id]
    );

    // Log audit
    await logAdminAction(admin.userId, 'update_category', 'categories', id, { name, slug }, request as any);

    return NextResponse.json({ success: true, message: 'Category updated' });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, message: 'Error updating category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await executeQuery('UPDATE categories SET deleted_at = NOW() WHERE id = ?', [id]);

    // Log audit
    await logAdminAction(admin.userId, 'soft_delete_category', 'categories', id, null, request as any);

    return NextResponse.json({ success: true, message: 'Category deleted (soft delete)' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, message: 'Error deleting category' }, { status: 500 });
  }
}
