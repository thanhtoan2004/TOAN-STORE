import { db } from './drizzle';
import { productVariants, inventory, inventoryLogs, products } from './schema';
import { eq, and, sql } from 'drizzle-orm';

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  barcode?: string;
  size?: string;
  colorId?: number;
  attributes?: {
    [key: string]: any;
  };
  price: number;
  weight?: number;
  height?: number;
  width?: number;
  depth?: number;
  productName?: string;
}

export interface InventoryData {
  id: number;
  productVariantId: number;
  warehouseId?: number;
  quantity: number;
  reserved: number;
  available: number;
}

/**
 * Get all variants for a product with inventory
 */
export async function getProductVariants(productId: number): Promise<any[]> {
  return await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      size: productVariants.size,
      colorId: productVariants.colorId,
      attributes: productVariants.attributes,
      price: productVariants.price,
      weight: productVariants.weight,
      height: productVariants.height,
      width: productVariants.width,
      depth: productVariants.depth,
      inventoryId: inventory.id,
      warehouseId: inventory.warehouseId,
      quantity: sql<number>`COALESCE(${inventory.quantity}, 0)`,
      reserved: sql<number>`COALESCE(${inventory.reserved}, 0)`,
      available: sql<number>`COALESCE(${inventory.quantity}, 0) - COALESCE(${inventory.reserved}, 0)`,
      lowStockThreshold: sql<number>`COALESCE(${inventory.lowStockThreshold}, 10)`,
      allowBackorder: sql<number>`COALESCE(${inventory.allowBackorder}, 0)`,
      expectedRestockDate: inventory.expectedRestockDate,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.productVariantId, productVariants.id))
    .where(eq(productVariants.productId, productId))
    .orderBy(productVariants.id);
}

/**
 * Get a specific variant by ID
 */
export async function getVariantById(variantId: number): Promise<any | null> {
  const [row] = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      size: productVariants.size,
      colorId: productVariants.colorId,
      attributes: productVariants.attributes,
      price: productVariants.price,
      weight: productVariants.weight,
      height: productVariants.height,
      width: productVariants.width,
      depth: productVariants.depth,
      inventoryId: inventory.id,
      warehouseId: inventory.warehouseId,
      quantity: sql<number>`COALESCE(${inventory.quantity}, 0)`,
      reserved: sql<number>`COALESCE(${inventory.reserved}, 0)`,
      available: sql<number>`COALESCE(${inventory.quantity}, 0) - COALESCE(${inventory.reserved}, 0)`,
      lowStockThreshold: sql<number>`COALESCE(${inventory.lowStockThreshold}, 10)`,
      allowBackorder: sql<number>`COALESCE(${inventory.allowBackorder}, 0)`,
      expectedRestockDate: inventory.expectedRestockDate,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.productVariantId, productVariants.id))
    .where(eq(productVariants.id, variantId))
    .limit(1);

  return row || null;
}

/**
 * Find variant by product ID and size
 */
export async function findVariantBySize(productId: number, size: string): Promise<any | null> {
  const [row] = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      size: productVariants.size,
      colorId: productVariants.colorId,
      attributes: productVariants.attributes,
      price: productVariants.price,
      weight: productVariants.weight,
      height: productVariants.height,
      width: productVariants.width,
      depth: productVariants.depth,
      productName: products.name,
      inventoryId: inventory.id,
      warehouseId: inventory.warehouseId,
      quantity: sql<number>`COALESCE(${inventory.quantity}, 0)`,
      reserved: sql<number>`COALESCE(${inventory.reserved}, 0)`,
      available: sql<number>`COALESCE(${inventory.quantity}, 0) - COALESCE(${inventory.reserved}, 0)`,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(inventory.productVariantId, productVariants.id))
    .where(and(eq(productVariants.productId, productId), eq(productVariants.size, size)))
    .limit(1);

  return row || null;
}

/**
 * Check if variant has enough stock
 */
export async function checkStock(variantId: number, requestedQuantity: number): Promise<boolean> {
  const [row] = await db
    .select({
      available: sql<number>`COALESCE(${inventory.quantity}, 0) - COALESCE(${inventory.reserved}, 0)`,
      allowBackorder: sql<number>`COALESCE(${inventory.allowBackorder}, 0)`,
    })
    .from(inventory)
    .where(eq(inventory.productVariantId, variantId))
    .limit(1);

  if (!row) return false;

  return row.available >= requestedQuantity || row.allowBackorder === 1;
}

/**
 * Reserve stock for an order
 */
export async function reserveStock(
  variantId: number,
  quantity: number,
  orderId: string
): Promise<boolean> {
  return await db.transaction(async (tx) => {
    const [result] = await tx
      .update(inventory)
      .set({
        reserved: sql`${inventory.reserved} + ${quantity}`,
      })
      .where(
        and(
          eq(inventory.productVariantId, variantId),
          sql`(${inventory.quantity} - ${inventory.reserved}) >= ${quantity} OR ${inventory.allowBackorder} = 1`
        )
      );

    if (result.affectedRows === 0) {
      return false;
    }

    const [inv] = await tx
      .select({ id: inventory.id })
      .from(inventory)
      .where(eq(inventory.productVariantId, variantId))
      .limit(1);

    if (inv) {
      await tx.insert(inventoryLogs).values({
        inventoryId: inv.id,
        quantityChange: -quantity,
        reason: 'order_reserved',
        referenceId: orderId,
      });
    }

    return true;
  });
}

/**
 * Release reserved stock
 */
export async function releaseStock(
  variantId: number,
  quantity: number,
  orderId: string
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(inventory)
      .set({ reserved: sql`${inventory.reserved} - ${quantity}` })
      .where(eq(inventory.productVariantId, variantId));

    const [inv] = await tx
      .select({ id: inventory.id })
      .from(inventory)
      .where(eq(inventory.productVariantId, variantId))
      .limit(1);

    if (inv) {
      await tx.insert(inventoryLogs).values({
        inventoryId: inv.id,
        quantityChange: quantity,
        reason: 'order_cancelled',
        referenceId: orderId,
      });
    }
  });
}

/**
 * Complete stock deduction when order is fulfilled
 */
export async function deductStock(
  variantId: number,
  quantity: number,
  orderId: string
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(inventory)
      .set({
        quantity: sql`${inventory.quantity} - ${quantity}`,
        reserved: sql`${inventory.reserved} - ${quantity}`,
      })
      .where(eq(inventory.productVariantId, variantId));

    const [inv] = await tx
      .select({ id: inventory.id })
      .from(inventory)
      .where(eq(inventory.productVariantId, variantId))
      .limit(1);

    if (inv) {
      await tx.insert(inventoryLogs).values({
        inventoryId: inv.id,
        quantityChange: -quantity,
        reason: 'order_fulfilled',
        referenceId: orderId,
      });
    }
  });
}

/**
 * Add stock
 */
export async function addStock(
  variantId: number,
  quantity: number,
  reason: string = 'restock',
  referenceId?: string
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(inventory)
      .set({ quantity: sql`${inventory.quantity} + ${quantity}` })
      .where(eq(inventory.productVariantId, variantId));

    const [inv] = await tx
      .select({ id: inventory.id })
      .from(inventory)
      .where(eq(inventory.productVariantId, variantId))
      .limit(1);

    if (inv) {
      await tx.insert(inventoryLogs).values({
        inventoryId: inv.id,
        quantityChange: quantity,
        reason: reason as any,
        referenceId: referenceId || null,
      });
    }
  });
}
