import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { menuItems } from '@/lib/db/schema';
import { eq, asc, isNull } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý danh mục điều hướng (Menu Items) - Admin.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    if (location) {
      // Correct way to build dynamic query with where
      const results = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.location, location))
        .orderBy(asc(menuItems.order));
      return ResponseWrapper.success(results);
    }

    const allItems = await db.select().from(menuItems).orderBy(asc(menuItems.order));
    return ResponseWrapper.success(allItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { title, titleEn, href, location, order, isActive, parentId } = body;

    if (!title || !location) return ResponseWrapper.error('Title and Location are required', 400);

    const [result] = await db.insert(menuItems).values({
      title,
      titleEn,
      href,
      location,
      order: order || 0,
      isActive: isActive ? 1 : 0,
      parentId,
    });

    return ResponseWrapper.success(null, 'Created successfully', 201);
  } catch (error) {
    console.error('Error creating menu item:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { id, title, titleEn, href, location, order, isActive, parentId } = body;

    if (!id) return ResponseWrapper.error('ID required', 400);

    const updates: any = {};
    if (title) updates.title = title;
    if (titleEn !== undefined) updates.titleEn = titleEn;
    if (href !== undefined) updates.href = href;
    if (location) updates.location = location;
    if (order !== undefined) updates.order = order;
    if (isActive !== undefined) updates.isActive = isActive ? 1 : 0;
    if (parentId !== undefined) updates.parentId = parentId;

    await db.update(menuItems).set(updates).where(eq(menuItems.id, id));

    return ResponseWrapper.success(null, 'Updated successfully');
  } catch (error) {
    console.error('Error updating menu item:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return ResponseWrapper.error('ID required', 400);

    await db.delete(menuItems).where(eq(menuItems.id, parseInt(id)));

    return ResponseWrapper.success(null, 'Deleted successfully');
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}
