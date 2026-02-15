
import { MeiliSearch } from 'meilisearch';

// Initialize the MeiliSearch client
// Ensure env vars are set, fallback to defaults for development
const host = process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const apiKey = process.env.MEILISEARCH_MASTER_KEY || 'masterKey';

export const meiliClient = new MeiliSearch({
    host,
    apiKey,
});

console.log(`[SERVICE_INITIALIZATION] Meilisearch client initialized at ${host}`);

// Product Index Schema
export interface ProductDocument {
    id: number;
    name: string;
    slug: string;
    description: string;
    short_description: string;
    base_price: number;
    retail_price: number;
    current_price: number;
    image_url: string;
    category_name: string;
    brand_name: string;
    is_active: boolean;
    is_new_arrival: boolean;
    created_at: number; // Unix timestamp for sorting
}

// Index Name
export const PRODUCT_INDEX = 'products';

// Helper to get index (and create if not exists - handled in sync script)
export const getProductIndex = () => meiliClient.index<ProductDocument>(PRODUCT_INDEX);

/**
 * Syncs a single product to Meilisearch
 */
export async function syncProductToMeilisearch(productId: number | string) {
    try {
        const { executeQuery } = await import('@/lib/db/mysql');

        // Fetch product with category and brand names
        const products = await executeQuery<any[]>(`
            SELECT 
                p.id, 
                p.name, 
                p.slug, 
                p.description, 
                p.short_description, 
                p.base_price, 
                p.retail_price, 
                p.is_new_arrival, 
                p.created_at,
                c.name as category_name,
                b.name as brand_name,
                (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image,
                (SELECT url FROM product_images WHERE product_id = p.id LIMIT 1) as fallback_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.id = ? AND p.deleted_at IS NULL AND p.is_active = 1
        `, [productId]);

        if (products.length === 0) {
            // If product is inactive or soft-deleted, remove from index
            await deleteProductFromMeilisearch(productId);
            return;
        }

        const p = products[0];
        const price = Number(p.retail_price || p.base_price);

        const document: ProductDocument = {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description || '',
            short_description: p.short_description || '',
            base_price: Number(p.base_price),
            retail_price: Number(p.retail_price || 0),
            current_price: price,
            image_url: p.main_image || p.fallback_image || '',
            category_name: p.category_name || 'Uncategorized',
            brand_name: p.brand_name || 'No Brand',
            is_active: true,
            is_new_arrival: !!p.is_new_arrival,
            created_at: new Date(p.created_at).getTime(),
        };

        const index = getProductIndex();
        await index.addDocuments([document]);
        console.log(`✅ Meilisearch: Synced product ${productId}`);
    } catch (error) {
        console.error(`❌ Meilisearch: Failed to sync product ${productId}:`, error);
    }
}

/**
 * Deletes a product from Meilisearch
 */
export async function deleteProductFromMeilisearch(productId: number | string) {
    try {
        const index = getProductIndex();
        await index.deleteDocument(productId);
        console.log(`✅ Meilisearch: Deleted product ${productId}`);
    } catch (error) {
        console.error(`❌ Meilisearch: Failed to delete product ${productId}:`, error);
    }
}
