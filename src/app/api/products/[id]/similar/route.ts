import { NextResponse } from 'next/server';
import { getSimilarProducts } from '@/lib/db/repositories/recommendation';

/**
 * API Gợi ý sản phẩm tương tự (Alternative Suggestions).
 * Logic: Tìm kiếm các sản phẩm cùng danh mục, phong cách hoặc mức giá để tối ưu tỷ lệ chuyển đổi.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 });
    }

    try {
        const similarProducts = await getSimilarProducts(productId, 4); // Fetch 4 similar products
        return NextResponse.json({ success: true, data: similarProducts });
    } catch (error) {
        console.error('API Similar Products Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
