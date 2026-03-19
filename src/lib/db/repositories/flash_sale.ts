import { db } from '../drizzle';
import { flashSales, flashSaleItems, orders, orderItems } from '../schema';
import { eq, and, lte, gte, sql, notInArray, between } from 'drizzle-orm';

export interface FlashSaleItem {
  id: number;
  flashSaleId: number;
  productId: number;
  flashPrice: string;
  perUserLimit: number;
  quantityLimit: number;
  quantitySold: number;
  startTime: Date;
  endTime: Date;
  name: string;
}

export async function getActiveFlashSale(): Promise<any | null> {
  const [sale] = await db
    .select()
    .from(flashSales)
    .where(
      and(
        eq(flashSales.isActive, 1),
        lte(flashSales.startTime, new Date()),
        gte(flashSales.endTime, new Date())
      )
    )
    .limit(1);

  if (!sale) return null;

  const items = await db
    .select()
    .from(flashSaleItems)
    .where(eq(flashSaleItems.flashSaleId, sale.id));

  return { ...sale, items };
}

export async function updateFlashSaleSoldQuantity(flashSaleItemId: number, quantity: number) {
  await db
    .update(flashSaleItems)
    .set({
      quantitySold: sql`${flashSaleItems.quantitySold} + ${quantity}`,
    })
    .where(eq(flashSaleItems.id, flashSaleItemId));
}

export async function checkFlashSaleLimit(
  userId: number,
  flashSaleItemId: number
): Promise<number> {
  // Count how many items of this flash sale product the user has already bought
  const [result] = await db
    .select({
      totalBought: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(
      flashSaleItems,
      and(
        eq(flashSaleItems.id, flashSaleItemId),
        eq(orderItems.productId, flashSaleItems.productId)
      )
    )
    .innerJoin(flashSales, eq(flashSaleItems.flashSaleId, flashSales.id))
    .where(
      and(
        eq(orders.userId, userId),
        notInArray(orders.status, ['cancelled', 'refunded']),
        between(orders.createdAt, flashSales.startTime, flashSales.endTime)
      )
    );

  return Number(result?.totalBought || 0);
}
