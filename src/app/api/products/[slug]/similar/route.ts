import { NextResponse } from 'next/server';
import { getSimilarProducts } from '@/lib/db/repositories/recommendation';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API Gợi ý sản phẩm tương tự (Alternative Suggestions).
 * Logic: Tìm kiếm các sản phẩm cùng danh mục, phong cách hoặc mức giá để tối ưu tỷ lệ chuyển đổi.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Resolve product ID from slug or ID
        const isNumericId = /^\d+$/.test(slug);
        let productId: number;

        if (isNumericId) {
            productId = parseInt(slug);
        } else {
            const products = await executeQuery(
                'SELECT id FROM products WHERE slug = ?',
                [slug]
            ) as any[];

            if (products.length === 0) {
                return NextResponse.json(
                    { success: false, message: 'Sản phẩm không tồn tại' },
                    { status: 404 }
                );
            }
            productId = products[0].id;
        }

        const similarProducts = await getSimilarProducts(productId, 4); // Fetch 4 similar products
        return NextResponse.json({ success: true, data: similarProducts });
    } catch (error) {
        console.error('API Similar Products Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
