import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { db } from '@/lib/db/drizzle';
import { categories as categoriesSchema } from '@/lib/db/schema';
import { eq, sql, asc } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const data = await db.select()
      .from(categoriesSchema)
      .where(sql`${categoriesSchema.deletedAt} IS NULL`)
      .orderBy(asc(categoriesSchema.position));

    return ResponseWrapper.success(data);
  } catch (error) {
    logger.error(error, 'Error fetching categories');
    return ResponseWrapper.serverError('Error fetching categories', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const { name, slug, description, image_url, position } = await request.json();

    const [result] = await db.insert(categoriesSchema).values({
      name,
      slug,
      description,
      imageUrl: image_url,
      position: position || 0,
      isActive: 1,
    });

    const insertId = (result as any).insertId;

    // Log audit
    await logAdminAction(admin.userId, 'CREATE_CATEGORY', 'categories', String(insertId), null, { name, slug, position }, request);

    return ResponseWrapper.success({ id: insertId }, 'Category created', 201);
  } catch (error) {
    logger.error(error, 'Error creating category');
    return ResponseWrapper.serverError('Error creating category', error);
  }
}
