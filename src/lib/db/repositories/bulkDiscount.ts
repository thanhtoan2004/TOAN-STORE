import { db } from '../drizzle';
import { bulkDiscounts, categories } from '../schema';
import { eq, and, sql, desc, lte, gte } from 'drizzle-orm';

export async function getBulkDiscounts() {
  return await db
    .select({
      id: bulkDiscounts.id,
      name: bulkDiscounts.name,
      discountPercentage: bulkDiscounts.discountPercentage,
      categoryId: bulkDiscounts.categoryId,
      categoryName: categories.name,
      startTime: bulkDiscounts.startTime,
      endTime: bulkDiscounts.endTime,
      isActive: bulkDiscounts.isActive,
    })
    .from(bulkDiscounts)
    .leftJoin(categories, eq(bulkDiscounts.categoryId, categories.id))
    .orderBy(desc(bulkDiscounts.createdAt));
}

export async function createBulkDiscount(data: any) {
  const [result] = await db.insert(bulkDiscounts).values({
    name: data.name,
    discountPercentage: data.discountPercentage,
    categoryId: data.categoryId || null,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    isActive: 1,
  });
  return result.insertId;
}

export async function deleteBulkDiscount(id: number) {
  await db.delete(bulkDiscounts).where(eq(bulkDiscounts.id, id));
}

export async function toggleBulkDiscount(id: number, isActive: number) {
  await db.update(bulkDiscounts).set({ isActive }).where(eq(bulkDiscounts.id, id));
}
