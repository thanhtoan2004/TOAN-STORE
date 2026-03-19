import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { products as productsTable } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getProductVariants } from '@/lib/db/variants';
import { ResponseWrapper } from '@/lib/api/api-response';

// GET /api/products/[id]/variants - Get all variants for a product
/**
 * API Lấy danh sách các biến thể (SKU) của một sản phẩm.
 * Dữ liệu bao gồm: Size, Màu sắc, Giá và trạng thái tồn kho chi tiết (Số lượng thực, Đã giữ chỗ, Khả dụng).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Resolve product ID from slug or ID
    const isNumericId = /^\d+$/.test(slug);
    let productId: number;

    if (isNumericId) {
      productId = parseInt(slug);
    } else {
      const [product] = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(and(eq(productsTable.slug, slug), isNull(productsTable.deletedAt)))
        .limit(1);

      if (!product) {
        return ResponseWrapper.notFound('Sản phẩm không tồn tại');
      }
      productId = product.id;
    }

    const variants = await getProductVariants(productId);

    // Format response with cleaner structure
    const formattedVariants = variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size || null,
      color: v.color || null,
      price: v.price,
      stock: {
        quantity: v.quantity,
        reserved: v.reserved,
        available: v.available,
      },
      inStock: v.available > 0,
    }));

    return ResponseWrapper.success(formattedVariants);
  } catch (error) {
    console.error('Error fetching product variants:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
