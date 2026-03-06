// Product Variants Helper Functions
// Use these instead of direct product_sizes queries

import { query } from './mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  barcode?: string;
  size?: string;
  colorId?: number; // Updated to FK
  attributes?: {
    [key: string]: any;
  };
  price: number;
  weight?: number;
  height?: number;
  width?: number;
  depth?: number;
  product_name?: string;
}

export interface InventoryData {
  id: number;
  product_variant_id: number;
  warehouse_id?: number;
  quantity: number;
  reserved: number;
  available: number; // calculated: quantity - reserved
}

/**
 * Get all variants for a product with inventory
 */
export async function getProductVariants(
  productId: number
): Promise<(ProductVariant & InventoryData)[]> {
  const sql = `
    SELECT 
      pv.id,
      pv.product_id,
      pv.sku,
      pv.barcode,
      pv.size,
      pv.color_id,
      pv.attributes,
      pv.price,
      pv.weight,
      pv.height,
      pv.width,
      pv.depth,
      i.id as inventory_id,
      i.warehouse_id,
      COALESCE(i.quantity, 0) as quantity,
      COALESCE(i.reserved, 0) as reserved,
      COALESCE(i.quantity, 0) - COALESCE(i.reserved, 0) as available,
      COALESCE(i.low_stock_threshold, 10) as low_stock_threshold,
      COALESCE(i.allow_backorder, 0) as allow_backorder,
      i.expected_restock_date
    FROM product_variants pv
    LEFT JOIN inventory i ON i.product_variant_id = pv.id
    WHERE pv.product_id = ?
    ORDER BY pv.id
  `;

  const results = await query<RowDataPacket[]>(sql, [productId]);

  return results.map((row) => ({
    ...row,
    attributes:
      row.attributes && typeof row.attributes === 'string'
        ? JSON.parse(row.attributes)
        : row.attributes || {},
  })) as (ProductVariant & InventoryData)[];
}

/**
 * Get a specific variant by ID
 */
export async function getVariantById(
  variantId: number
): Promise<(ProductVariant & InventoryData) | null> {
  const sql = `
    SELECT 
      pv.*,
      i.id as inventory_id,
      i.warehouse_id,
      COALESCE(i.quantity, 0) as quantity,
      COALESCE(i.reserved, 0) as reserved,
      COALESCE(i.quantity, 0) - COALESCE(i.reserved, 0) as available,
      COALESCE(i.low_stock_threshold, 10) as low_stock_threshold,
      COALESCE(i.allow_backorder, 0) as allow_backorder,
      i.expected_restock_date
    FROM product_variants pv
    LEFT JOIN inventory i ON i.product_variant_id = pv.id
    WHERE pv.id = ?
  `;

  const results = await query<RowDataPacket[]>(sql, [variantId]);

  if (results.length === 0) return null;

  const row = results[0];
  return {
    ...row,
    attributes:
      row.attributes && typeof row.attributes === 'string'
        ? JSON.parse(row.attributes)
        : row.attributes || {},
  } as ProductVariant & InventoryData;
}

/**
 * Find variant by product ID and size (backward compatibility)
 */
export async function findVariantBySize(
  productId: number,
  size: string
): Promise<(ProductVariant & InventoryData) | null> {
  const sql = `
    SELECT 
      pv.*,
      p.name as product_name,
      i.id as inventory_id,
      i.warehouse_id,
      COALESCE(i.quantity, 0) as quantity,
      COALESCE(i.reserved, 0) as reserved,
      COALESCE(i.quantity, 0) - COALESCE(i.reserved, 0) as available
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN inventory i ON i.product_variant_id = pv.id
    WHERE pv.product_id = ?
    AND pv.size = ?
  `;

  const results = await query<RowDataPacket[]>(sql, [productId, size]);

  if (results.length === 0) return null;

  const row = results[0];
  return {
    ...row,
    attributes:
      row.attributes && typeof row.attributes === 'string'
        ? JSON.parse(row.attributes)
        : row.attributes || {},
  } as ProductVariant & InventoryData;
}

/**
 * Check if variant has enough stock
 */
export async function checkStock(variantId: number, requestedQuantity: number): Promise<boolean> {
  const sql = `
    SELECT 
      (COALESCE(i.quantity, 0) - COALESCE(i.reserved, 0)) as available,
      COALESCE(i.allow_backorder, 0) as allowBackorder
    FROM inventory i
    WHERE i.product_variant_id = ?
  `;

  const results = await query<RowDataPacket[]>(sql, [variantId]);

  if (results.length === 0) return false;

  const { available, allowBackorder } = results[0];
  return available >= requestedQuantity || allowBackorder === 1;
}

/**
 * Reserve stock for an order (atomic operation)
 */
export async function reserveStock(
  variantId: number,
  quantity: number,
  orderId: string
): Promise<boolean> {
  const { getConnection } = await import('./mysql');
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Check and update inventory
    const [rows]: any = await connection.query(
      `UPDATE inventory 
       SET reserved = reserved + ?
       WHERE product_variant_id = ?
       AND (
         (quantity - reserved) >= ?
         OR allow_backorder = 1
       )`,
      [quantity, variantId, quantity]
    );

    if (rows.affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    // Log the reservation
    await connection.query(
      `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
       SELECT id, ?, 'order_reserved', ?
       FROM inventory
       WHERE product_variant_id = ?`,
      [-quantity, orderId, variantId]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Release reserved stock (e.g., when order is cancelled)
 */
export async function releaseStock(
  variantId: number,
  quantity: number,
  orderId: string
): Promise<void> {
  const { getConnection } = await import('./mysql');
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE inventory 
       SET reserved = reserved - ?
       WHERE product_variant_id = ?`,
      [quantity, variantId]
    );

    await connection.query(
      `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
       SELECT id, ?, 'order_cancelled', ?
       FROM inventory
       WHERE product_variant_id = ?`,
      [quantity, orderId, variantId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Complete stock deduction when order is fulfilled
 */
export async function deductStock(
  variantId: number,
  quantity: number,
  orderId: string
): Promise<void> {
  const { getConnection } = await import('./mysql');
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE inventory 
       SET quantity = quantity - ?,
           reserved = reserved - ?
       WHERE product_variant_id = ?`,
      [quantity, quantity, variantId]
    );

    await connection.query(
      `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
       SELECT id, ?, 'order_fulfilled', ?
       FROM inventory
       WHERE product_variant_id = ?`,
      [-quantity, orderId, variantId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Add stock (restocking, returns, etc.)
 */
export async function addStock(
  variantId: number,
  quantity: number,
  reason: string = 'restock',
  referenceId?: string
): Promise<void> {
  const { getConnection } = await import('./mysql');
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE inventory 
       SET quantity = quantity + ?
       WHERE product_variant_id = ?`,
      [quantity, variantId]
    );

    await connection.query(
      `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
       SELECT id, ?, ?, ?
       FROM inventory
       WHERE product_variant_id = ?`,
      [quantity, reason, referenceId, variantId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
