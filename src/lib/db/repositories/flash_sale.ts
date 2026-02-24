
import { executeQuery } from '../connection';

export interface FlashSaleItem {
    id: number;
    flash_sale_id: number;
    product_id: number;
    sale_price: number;
    limit_per_customer: number;
    total_quantity: number;
    sold_quantity: number;
    start_time: string;
    end_time: string;
    name: string;
}

export async function getActiveFlashSaleItem(productId: number): Promise<FlashSaleItem | null> {
    const query = `
        SELECT 
            fsi.*,
            fs.start_time,
            fs.end_time,
            fs.name
        FROM flash_sale_items fsi
        JOIN flash_sales fs ON fsi.flash_sale_id = fs.id
        WHERE fsi.product_id = ?
        AND fs.is_active = 1
        AND fs.start_time <= NOW()
        AND fs.end_time >= NOW()
        LIMIT 1
    `;

    const results = await executeQuery<FlashSaleItem[]>(query, [productId]);
    return results.length > 0 ? results[0] : null;
}

export async function updateFlashSaleSoldQuantity(flashSaleItemId: number, quantity: number) {
    await executeQuery(
        `UPDATE flash_sale_items 
         SET sold_quantity = sold_quantity + ? 
         WHERE id = ?`,
        [quantity, flashSaleItemId]
    );
}

export async function checkFlashSaleLimit(userId: number, flashSaleItemId: number): Promise<number> {
    // Count how many items of this flash sale product the user has already bought
    // We check completed/processing orders that contain the same product_id as the flash sale item
    const query = `
        SELECT COALESCE(SUM(oi.quantity), 0) as total_bought
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN flash_sale_items fsi ON fsi.id = ? AND oi.product_id = fsi.product_id
        JOIN flash_sales fs ON fsi.flash_sale_id = fs.id
        WHERE o.user_id = ?
        AND o.status NOT IN ('cancelled', 'refunded')
        AND o.created_at BETWEEN fs.start_time AND fs.end_time
    `;

    const results = await executeQuery<any[]>(query, [flashSaleItemId, userId]);
    return results[0]?.total_bought || 0;
}
