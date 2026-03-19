import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { products as productsTable } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getSimilarProducts } from '@/lib/db/repositories/recommendation';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Gợi ý sản phẩm tương tự (Alternative Suggestions).
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

    const similarProducts = await getSimilarProducts(productId, 4); // Fetch 4 similar products
    return ResponseWrapper.success(similarProducts);
  } catch (error) {
    console.error('API Similar Products Error:', error);
    return ResponseWrapper.serverError('Server error', error);
  }
}
