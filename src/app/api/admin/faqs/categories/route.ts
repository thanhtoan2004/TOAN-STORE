import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { faqCategories } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý danh mục Câu hỏi thường gặp (FAQ Categories).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const categories = await db
      .select()
      .from(faqCategories)
      .orderBy(asc(faqCategories.position), desc(faqCategories.createdAt));

    return ResponseWrapper.success(categories);
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { name, slug, description, icon, position, sectionLinks, isActive } = body;

    if (!name || !slug) {
      return ResponseWrapper.error('Name and slug are required', 400);
    }

    await db.insert(faqCategories).values({
      name,
      slug,
      description,
      icon,
      position: position || 0,
      sectionLinks: sectionLinks || [],
      isActive: isActive !== undefined ? (isActive ? 1 : 0) : 1,
    });

    return ResponseWrapper.success(null, 'Created successfully', 201);
  } catch (error) {
    console.error('Error creating FAQ category:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { id, name, slug, description, icon, position, sectionLinks, isActive } = body;

    if (!id) return ResponseWrapper.error('ID required', 400);

    const updates: any = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (position !== undefined) updates.position = position;
    if (sectionLinks !== undefined) updates.sectionLinks = sectionLinks;
    if (isActive !== undefined) updates.isActive = isActive ? 1 : 0;

    await db.update(faqCategories).set(updates).where(eq(faqCategories.id, id));

    return ResponseWrapper.success(null, 'Updated successfully');
  } catch (error) {
    console.error('Error updating FAQ category:', error);
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

    await db.delete(faqCategories).where(eq(faqCategories.id, parseInt(id)));

    return ResponseWrapper.success(null, 'Deleted successfully');
  } catch (error) {
    console.error('Error deleting FAQ category:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}
