import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  products as productsTable,
  productImages,
  categories as categoriesTable,
} from '@/lib/db/schema';
import { eq, and, sql, isNull, ne } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy danh sách sản phẩm liên quan (You may also like).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Resolve product ID from slug or ID
    const isNumericId = /^\d+$/.test(slug);
    let productId: number;
    let categoryId: number | null = null;

    if (isNumericId) {
      productId = parseInt(slug);
    } else {
      const [product] = await db
        .select({ id: productsTable.id, categoryId: productsTable.categoryId })
        .from(productsTable)
        .where(and(eq(productsTable.slug, slug), isNull(productsTable.deletedAt)))
        .limit(1);

      if (!product) {
        return ResponseWrapper.notFound('Sản phẩm không tồn tại');
      }
      productId = product.id;
      categoryId = product.categoryId;
    }

    if (!categoryId) {
      const [currentProduct] = await db
        .select({ categoryId: productsTable.categoryId })
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1);

      if (!currentProduct) {
        return ResponseWrapper.notFound('Product not found');
      }
      categoryId = currentProduct.categoryId;
    }

    // 2. data fetch - related products in same category
    const relatedProducts = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        price: productsTable.priceCache,
        salePrice: productsTable.msrpPrice,
        isNewArrival: productsTable.isNewArrival,
        imageUrl: sql<string>`(SELECT url FROM ${productImages} WHERE product_id = ${productsTable.id} AND is_main = 1 LIMIT 1)`,
        category: sql<string>`(SELECT name FROM ${categoriesTable} WHERE id = ${productsTable.categoryId})`,
      })
      .from(productsTable)
      .where(
        and(
          eq(productsTable.categoryId, categoryId!),
          ne(productsTable.id, productId),
          eq(productsTable.isActive, 1),
          isNull(productsTable.deletedAt)
        )
      )
      .orderBy(sql`RAND()`)
      .limit(4);

    return ResponseWrapper.success(relatedProducts);
  } catch (error) {
    console.error('Get related products error:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
