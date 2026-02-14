
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
    // Count how many items of this flash sale the user has already bought (in orders)
    // Note: This matches orders that contain the product during the flash sale period.
    // However, exact mapping is hard without storing flash_sale_id in order_items.
    // For now, we can check active orders within the flash sale time window?
    // Or simpler: We should migrate to store flash_sale_id in order_items for accurate tracking.

    // Fallback: Just return 0 for now as we don't have order history tracking for specific flash sale instance yet.
    // We will enforce limit in Cart for the current session.

    return 0; // TODO: Implement robust limit check across orders
}
