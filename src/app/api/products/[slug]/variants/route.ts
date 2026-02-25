import { NextRequest, NextResponse } from 'next/server';
import { getProductVariants } from '@/lib/db/variants';
import { executeQuery } from '@/lib/db/mysql';

// GET /api/products/[id]/variants - Get all variants for a product
/**
 * API Lấy danh sách các biến thể (SKU) của một sản phẩm.
 * Dữ liệu bao gồm: Size, Màu sắc, Giá và trạng thái tồn kho chi tiết (Số lượng thực, Đã giữ chỗ, Khả dụng).
 */
export async function GET(
  request: NextRequest,
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

    const variants = await getProductVariants(productId);

    // Format response with cleaner structure
    const formattedVariants = variants.map(v => ({
      id: v.id,
      sku: v.sku,
      size: v.size || null,
      color: v.color || null,
      price: v.price,
      stock: {
        quantity: v.quantity,
        reserved: v.reserved,
        available: v.available
      },
      inStock: v.available > 0
    }));

    return NextResponse.json({
      success: true,
      data: formattedVariants
    });
  } catch (error) {
    console.error('Error fetching product variants:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}
