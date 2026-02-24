import { NextRequest, NextResponse } from 'next/server';
import { getProductVariants } from '@/lib/db/variants';

// GET /api/products/[id]/variants - Get all variants for a product
/**
 * API Lấy danh sách các biến thể (SKU) của một sản phẩm.
 * Dữ liệu bao gồm: Size, Màu sắc, Giá và trạng thái tồn kho chi tiết (Số lượng thực, Đã giữ chỗ, Khả dụng).
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
        { success: false, message: 'Product ID không hợp lệ' },
        { status: 400 }
      );
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
