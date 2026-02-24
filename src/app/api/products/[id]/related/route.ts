
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API Lấy danh sách sản phẩm liên quan (You may also like).
 * Chức năng: Tìm ngẫu nhiên 4 sản phẩm trong cùng danh mục để hiển thị gợi ý mở rộng cho khách hàng.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productId = parseInt(id);
        if (isNaN(productId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid product ID' },
                { status: 400 }
            );
        }

        // 1. Get current product's category
        const currentProduct = await executeQuery(
            'SELECT category_id FROM products WHERE id = ?',
            [productId]
        ) as any[];

        if (currentProduct.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        const categoryId = currentProduct[0].category_id;

        // 2. data fetch - related products in same category
        // exclude current product, limit 4
        const relatedProducts = await executeQuery(
            `SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.base_price as price, 
        p.retail_price as sale_price,
        p.is_new_arrival,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url,
        (SELECT name FROM categories WHERE id = p.category_id) as category
       FROM products p
       WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
       ORDER BY RAND()
       LIMIT 4`,
            [categoryId, productId]
        );

        return NextResponse.json({
            success: true,
            data: relatedProducts
        });

    } catch (error) {
        console.error('Get related products error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
