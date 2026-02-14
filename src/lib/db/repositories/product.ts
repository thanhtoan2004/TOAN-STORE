import { executeQuery } from '../connection';

// Product functions
export async function getProductSizes(productId: number) {
    return executeQuery(`
    SELECT pv.size, i.quantity as stock, i.reserved, pv.price as price_adjustment
    FROM product_variants pv
    LEFT JOIN inventory i ON i.product_variant_id = pv.id
    WHERE pv.product_id = ?
    ORDER BY CAST(pv.size AS DECIMAL(10,1))`,
        [productId]
    );
}

export async function getProductById(productId: number) {
    const [product] = await executeQuery<any[]>(`
    SELECT * FROM products WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
        [productId]
    );
    return product;
}

export async function getProducts(filters: {
    category?: string;
    sport?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    isNewArrival?: boolean;
    limit?: number;
    offset?: number;
}) {
    let query = `
    SELECT 
      p.*,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url,
      (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count,
      (SELECT name FROM categories WHERE id = p.category_id) as category
    FROM products p
    WHERE p.is_active = 1 AND p.deleted_at IS NULL`;
    const params: any[] = [];

    if (filters.category) {
        query += ' AND p.category_id = (SELECT id FROM categories WHERE slug = ? OR name = ? LIMIT 1)';
        params.push(filters.category, filters.category);
    }

    if (filters.sport) {
        query += ' AND p.sport_id = (SELECT id FROM sports WHERE slug = ? OR name = ? LIMIT 1)';
        params.push(filters.sport, filters.sport);
    }

    if (filters.gender) {
        query += ' AND EXISTS (SELECT 1 FROM product_gender_categories pgc WHERE pgc.product_id = p.id AND pgc.gender = ?)';
        params.push(filters.gender);
    }

    if (filters.minPrice !== undefined) {
        query += ' AND (p.retail_price >= ? OR (p.retail_price IS NULL AND p.base_price >= ?))';
        params.push(filters.minPrice, filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
        query += ' AND (p.retail_price <= ? OR (p.retail_price IS NULL AND p.base_price <= ?))';
        params.push(filters.maxPrice, filters.maxPrice);
    }

    if (filters.isNewArrival) {
        query += ' AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    query += ' ORDER BY p.created_at DESC';

    if (filters.limit) {
        query += ` LIMIT ${filters.limit}`;

        if (filters.offset) {
            query += ` OFFSET ${filters.offset}`;
        }
    }

    return executeQuery(query, params);
}

// Chatbot Search Function
export async function searchProductsForChat(keyword: string) {
    try {
        // Search products by name (limit 5)
        const products = await executeQuery<any[]>(
            `SELECT p.id, p.name, p.base_price, p.retail_price, p.slug, p.short_description,
               (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        WHERE p.name LIKE ? AND p.is_active = 1 AND p.deleted_at IS NULL
        LIMIT 5`,
            [`%${keyword}%`]
        );

        // For each product, fetch available sizes and ratings via helper
        const result = await formatProductsForChat(products);
        return result;
    } catch (error) {
        console.error('Chatbot Search Error:', error);
        return [];
    }
}

export async function getNewArrivalsForChat() {
    try {
        const products = await executeQuery<any[]>(
            `SELECT p.id, p.name, p.base_price, p.retail_price, p.slug,
               (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        WHERE p.is_active = 1 AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC 
        LIMIT 5`
        );
        return formatProductsForChat(products);
    } catch (error) {
        console.error('Chatbot New Arrivals Error:', error);
        return [];
    }
}

export async function getDiscountedProductsForChat() {
    try {
        const products = await executeQuery<any[]>(
            `SELECT id, name, base_price, retail_price, slug,
               (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        WHERE p.is_active = 1 AND p.retail_price < p.base_price AND p.deleted_at IS NULL
        ORDER BY (p.base_price - p.retail_price) DESC 
        LIMIT 5`
        );
        return formatProductsForChat(products);
    } catch (error) {
        console.error('Chatbot Discount Error:', error);
        return [];
    }
}

export async function getProductsByCategoryForChat(categorySlug: string) {
    try {
        const products = await executeQuery<any[]>(
            `SELECT p.id, p.name, p.base_price, p.retail_price, p.slug,
               (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND (c.slug = ? OR c.name LIKE ?) AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC 
        LIMIT 5`,
            [categorySlug, `%${categorySlug}%`]
        );
        return formatProductsForChat(products);
    } catch (error) {
        console.error('Chatbot Category Error:', error);
        return [];
    }
}

// Helper to format products consistently for chat
export async function formatProductsForChat(products: any[]) {
    // For each product, fetch available sizes
    const result = await Promise.all(products.map(async (p) => {
        const sizes = await executeQuery<any[]>(
            `SELECT pv.size, (COALESCE(i.quantity, 0) - COALESCE(i.reserved, 0)) as stock 
         FROM product_variants pv 
         LEFT JOIN inventory i ON i.product_variant_id = pv.id
         WHERE pv.product_id = ? AND (COALESCE(i.quantity, 0) - COALESCE(i.reserved, 0)) > 0
         ORDER BY CAST(pv.size AS DECIMAL(10,1))`,
            [p.id]
        );

        const availableSizes = sizes.map(s => s.size).join(', ');
        const price = p.retail_price || p.base_price;
        const originalPrice = p.retail_price ? p.base_price : null;

        return {
            id: p.id,
            name: p.name,
            price: price,
            originalPrice: originalPrice,
            image_url: p.image_url || '/images/placeholder.png',
            sizes: availableSizes || 'Hết hàng', // Vietnamese 'Out of stock'
            link: `/products/${p.id}`
        };
    }));
    return result;
}

export async function softDeleteProduct(productId: number) {
    return executeQuery(
        'UPDATE products SET deleted_at = NOW() WHERE id = ?',
        [productId]
    );
}

export async function restoreProduct(productId: number) {
    return executeQuery(
        'UPDATE products SET deleted_at = NULL WHERE id = ?',
        [productId]
    );
}
