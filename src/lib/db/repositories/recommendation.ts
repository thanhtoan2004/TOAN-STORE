import { db } from '../drizzle';
import { products, productImages, categories, productEmbeddings } from '../schema';
import { eq, and, ne, sql, isNull } from 'drizzle-orm';

/**
 * Calculates cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (mA * mB);
}

export async function getSimilarProducts(productId: number, limit: number = 6) {
  try {
    // 1. Get embedding for the target product
    const [targetEmbed] = await db
      .select({ embedding: productEmbeddings.embedding })
      .from(productEmbeddings)
      .where(eq(productEmbeddings.productId, productId))
      .limit(1);

    if (!targetEmbed) {
      // Fallback: If no embedding, return products in same category
      const targetProduct = db
        .select({ categoryId: products.categoryId })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      return await db
        .select({
          id: products.id,
          name: products.name,
          categoryId: products.categoryId,
          price: products.msrpPrice,
          salePrice: products.priceCache,
          slug: products.slug,
          isNewArrival: products.isNewArrival,
          imageUrl: sql<string>`(SELECT url FROM ${productImages} WHERE product_id = ${products.id} AND is_main = 1 LIMIT 1)`,
          category: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.categoryId, sql`(${targetProduct})`),
            ne(products.id, productId),
            eq(products.isActive, 1),
            isNull(products.deletedAt)
          )
        )
        .limit(limit);
    }

    const targetEmbedding = JSON.parse(targetEmbed.embedding as string);

    // 2. Fetch all other product embeddings
    const allEmbeds = await db
      .select({
        productId: productEmbeddings.productId,
        embedding: productEmbeddings.embedding,
        name: products.name,
        price: products.msrpPrice,
        salePrice: products.priceCache,
        slug: products.slug,
        isNewArrival: products.isNewArrival,
        imageUrl: sql<string>`(SELECT url FROM ${productImages} WHERE product_id = ${products.id} AND is_main = 1 LIMIT 1)`,
        category: categories.name,
      })
      .from(productEmbeddings)
      .innerJoin(products, eq(productEmbeddings.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          ne(productEmbeddings.productId, productId),
          eq(products.isActive, 1),
          isNull(products.deletedAt)
        )
      );

    // 3. Calculate similarities
    const recommendations = allEmbeds.map((item) => {
      const currentEmbedding = JSON.parse(item.embedding as string);
      return {
        ...item,
        similarity: cosineSimilarity(targetEmbedding, currentEmbedding),
      };
    });

    // 4. Sort and limit
    return recommendations
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(({ embedding, similarity, ...rest }) => rest);
  } catch (error) {
    console.error('Similar Products Error:', error);
    return [];
  }
}
