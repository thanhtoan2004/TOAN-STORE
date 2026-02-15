import { executeQuery } from '@/lib/db/mysql';

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
        const targetEmbedResult = await executeQuery<any[]>(
            'SELECT embedding FROM product_embeddings WHERE product_id = ?',
            [productId]
        );

        if (targetEmbedResult.length === 0) {
            // Fallback: If no embedding, return products in same category
            return executeQuery<any[]>(`
        SELECT p.*, (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        WHERE category_id = (SELECT category_id FROM products WHERE id = ?)
        AND id != ? AND is_active = 1 AND deleted_at IS NULL
        LIMIT ?
      `, [productId, productId, limit]);
        }

        const targetEmbedding = JSON.parse(targetEmbedResult[0].embedding);

        // 2. Fetch all other product embeddings
        // NOTE: For thousands of products, this should be optimized with a Vector DB or custom plugin
        // For this implementation, we use in-memory matching with cache potential.
        const allEmbeddings = await executeQuery<any[]>(`
      SELECT pe.product_id, pe.embedding, p.name, p.retail_price, p.base_price, p.slug,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
      FROM product_embeddings pe
      JOIN products p ON pe.product_id = p.id
      WHERE pe.product_id != ? AND p.is_active = 1 AND p.deleted_at IS NULL
    `, [productId]);

        // 3. Calculate similarities
        const recommendations = allEmbeddings.map(item => {
            const currentEmbedding = JSON.parse(item.embedding);
            return {
                ...item,
                similarity: cosineSimilarity(targetEmbedding, currentEmbedding)
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
