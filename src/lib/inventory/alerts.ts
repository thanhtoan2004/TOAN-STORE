import { db } from '@/lib/db/drizzle';
import {
  inventory as inventoryTable,
  productVariants,
  products,
  stores as warehouses,
} from '@/lib/db/schema';
import { eq, and, lte, gt, isNull, desc, asc } from 'drizzle-orm';

export interface LowStockAlert {
  inventoryId: number;
  productVariantId: number;
  productName: string;
  sku: string;
  size: string;
  color: string | null;
  quantity: number;
  threshold: number;
  warehouseName: string | null;
}

/**
 * Get all inventory items that are below their low stock threshold
 */
export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const data = await db
    .select({
      inventoryId: inventoryTable.id,
      productVariantId: productVariants.id,
      productName: products.name,
      sku: productVariants.sku,
      size: productVariants.size,
      color: productVariants.colorId, // Assuming colorId for now as per schema
      quantity: inventoryTable.quantity,
      threshold: inventoryTable.lowStockThreshold,
      warehouseName: warehouses.name,
    })
    .from(inventoryTable)
    .innerJoin(productVariants, eq(inventoryTable.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(warehouses, eq(inventoryTable.warehouseId, warehouses.id))
    .where(
      and(
        lte(inventoryTable.quantity, inventoryTable.lowStockThreshold),
        gt(inventoryTable.quantity, 0),
        eq(products.isActive, 1),
        isNull(products.deletedAt)
      )
    )
    .orderBy(asc(inventoryTable.quantity));

  return data as any as LowStockAlert[];
}

/**
 * Get all items that are completely out of stock
 */
export async function getOutOfStockItems(): Promise<LowStockAlert[]> {
  const data = await db
    .select({
      inventoryId: inventoryTable.id,
      productVariantId: productVariants.id,
      productName: products.name,
      sku: productVariants.sku,
      size: productVariants.size,
      color: productVariants.colorId,
      quantity: inventoryTable.quantity,
      threshold: inventoryTable.lowStockThreshold,
      warehouseName: warehouses.name,
    })
    .from(inventoryTable)
    .innerJoin(productVariants, eq(inventoryTable.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(warehouses, eq(inventoryTable.warehouseId, warehouses.id))
    .where(
      and(lte(inventoryTable.quantity, 0), eq(products.isActive, 1), isNull(products.deletedAt))
    )
    .orderBy(desc(inventoryTable.updatedAt));

  return data as any as LowStockAlert[];
}
