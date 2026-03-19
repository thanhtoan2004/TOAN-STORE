import { db } from '../drizzle';
import { seoMetadata } from '../schema';
import { eq, and } from 'drizzle-orm';

export interface SeoMetadata {
  id?: number;
  entityType: 'product' | 'category' | 'collection' | 'page';
  entityId: number;
  title: string;
  description: string;
  keywords?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  structuredData?: any;
}

export async function getSeoMetadata(entityType: string, entityId: number): Promise<any | null> {
  const [row] = await db
    .select()
    .from(seoMetadata)
    .where(and(eq(seoMetadata.entityType, entityType as any), eq(seoMetadata.entityId, entityId)))
    .limit(1);
  return row || null;
}

export async function upsertSeoMetadata(data: SeoMetadata): Promise<boolean> {
  const existing = await getSeoMetadata(data.entityType, data.entityId);

  if (existing) {
    const [result] = await db
      .update(seoMetadata)
      .set({
        title: data.title,
        description: data.description,
        keywords: data.keywords || null,
        ogImageUrl: data.ogImageUrl || null,
        canonicalUrl: data.canonicalUrl || null,
        structuredData: data.structuredData || {},
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(seoMetadata.entityType, data.entityType as any),
          eq(seoMetadata.entityId, data.entityId)
        )
      );
    return result.affectedRows > 0;
  } else {
    const [result] = await db.insert(seoMetadata).values({
      entityType: data.entityType as any,
      entityId: data.entityId,
      title: data.title,
      description: data.description,
      keywords: data.keywords || null,
      ogImageUrl: data.ogImageUrl || null,
      canonicalUrl: data.canonicalUrl || null,
      structuredData: data.structuredData || {},
    });
    return result.insertId > 0;
  }
}

export async function deleteSeoMetadata(entityType: string, entityId: number): Promise<boolean> {
  const [result] = await db
    .delete(seoMetadata)
    .where(and(eq(seoMetadata.entityType, entityType as any), eq(seoMetadata.entityId, entityId)));
  return result.affectedRows > 0;
}
