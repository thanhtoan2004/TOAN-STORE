import { executeQuery } from '@/lib/db/mysql';

export interface LowStockAlert {
    inventoryId: number;
    productVariantId: number;
    productName: string;
    sku: string;
    size: string;
    color: string;
    quantity: number;
    threshold: number;
    warehouseName: string;
}

/**
 * Get all inventory items that are below their low stock threshold
 */
export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
    const sql = `
        SELECT 
            i.id as inventoryId,
            pv.id as productVariantId,
            p.name as productName,
            pv.sku,
            pv.size,
            pv.color,
            i.quantity,
            i.low_stock_threshold as threshold,
            w.name as warehouseName
        FROM inventory i
        JOIN product_variants pv ON i.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN warehouses w ON i.warehouse_id = w.id
        WHERE i.quantity <= i.low_stock_threshold
          AND i.quantity > 0
          AND p.is_active = 1
          AND p.deleted_at IS NULL
        ORDER BY i.quantity ASC
    `;

    return await executeQuery<LowStockAlert[]>(sql);
}

/**
 * Get all items that are completely out of stock
 */
export async function getOutOfStockItems(): Promise<LowStockAlert[]> {
    const sql = `
        SELECT 
            i.id as inventoryId,
            pv.id as productVariantId,
            p.name as productName,
            pv.sku,
            pv.size,
            pv.color,
            i.quantity,
            i.low_stock_threshold as threshold,
            w.name as warehouseName
        FROM inventory i
        JOIN product_variants pv ON i.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN warehouses w ON i.warehouse_id = w.id
        WHERE i.quantity <= 0
          AND p.is_active = 1
          AND p.deleted_at IS NULL
        ORDER BY i.updated_at DESC
    `;

    return await executeQuery<LowStockAlert[]>(sql);
}
