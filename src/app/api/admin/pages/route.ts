import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { pages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';
import { sanitizeRichContent } from '@/lib/security/sanitize';

/**
 * API Quản lý các trang nội dung (Policies, CMS Pages) - Admin.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const allPages = await db.select().from(pages).orderBy(desc(pages.createdAt));

    return ResponseWrapper.success(allPages);
  } catch (error) {
    console.error('Error fetching CMS pages:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { title, slug, metaTitle, metaDescription, isActive } = body;
    const content = sanitizeRichContent(body.content || '');

    if (!title || !slug) return ResponseWrapper.error('Title and Slug are required', 400);

    await db.insert(pages).values({
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      isActive: isActive ? 1 : 0,
    });

    return ResponseWrapper.success(null, 'Created successfully', 201);
  } catch (error) {
    console.error('Error creating page:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { id, title, slug, metaTitle, metaDescription, isActive } = body;
    const content = sanitizeRichContent(body.content || '');

    if (!id) return ResponseWrapper.error('ID required', 400);

    const updates: any = {};
    if (title) updates.title = title;
    if (slug) updates.slug = slug;
    if (content !== undefined) updates.content = content;
    if (metaTitle !== undefined) updates.metaTitle = metaTitle;
    if (metaDescription !== undefined) updates.metaDescription = metaDescription;
    if (isActive !== undefined) updates.isActive = isActive ? 1 : 0;

    await db.update(pages).set(updates).where(eq(pages.id, id));

    return ResponseWrapper.success(null, 'Updated successfully');
  } catch (error) {
    console.error('Error updating page:', error);
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

    await db.delete(pages).where(eq(pages.id, parseInt(id)));

    return ResponseWrapper.success(null, 'Deleted successfully');
  } catch (error) {
    console.error('Error deleting page:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}
