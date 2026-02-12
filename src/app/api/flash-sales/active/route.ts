import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

/**
 * Get active flash sale
 * GET /api/flash-sales/active
 */
export async function GET() {
    try {
        const now = new Date();

        // Get active flash sale
        const [flashSale] = await query(
            `SELECT * FROM flash_sales
       WHERE is_active = 1
         AND start_time <= ?
         AND end_time > ?
       ORDER BY start_time DESC
       LIMIT 1`,
            [now, now]
        );

        if (!flashSale) {
            return NextResponse.json({
                success: true,
                data: null
            });
        }

        // Get flash sale products
        const products = await query(
            `SELECT 
        fsi.*,
        p.name,
        p.slug,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as imageUrl,
        p.base_price as originalPrice
       FROM flash_sale_items fsi
       JOIN products p ON fsi.product_id = p.id
       WHERE fsi.flash_sale_id = ?
         AND p.is_active = 1
       ORDER BY fsi.created_at ASC`,
            [flashSale.id]
        );

        return NextResponse.json({
            success: true,
            data: {
                id: flashSale.id,
                name: flashSale.name,
                description: flashSale.description,
                startTime: flashSale.start_time,
                endTime: flashSale.end_time,
                products: products.map((item: any) => ({
                    id: item.product_id,
                    name: item.name,
                    slug: item.slug,
                    imageUrl: item.imageUrl,
                    originalPrice: parseFloat(item.originalPrice),
                    flashPrice: parseFloat(item.flash_price),
                    discountPercentage: parseFloat(item.discount_percentage),
                    quantityLimit: item.quantity_limit,
                    quantitySold: item.quantity_sold
                }))
            }
        });

    } catch (error) {
        console.error('Get flash sale error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to get flash sale'
        }, { status: 500 });
    }
}
