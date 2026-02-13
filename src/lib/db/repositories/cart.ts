import { executeQuery } from '../connection';

// Cart functions
export async function addToCart(userId: number, productId: number, size: string, quantity: number = 1) {
    // Tìm hoặc tạo cart cho user
    const carts = await executeQuery<any[]>(`SELECT id FROM carts WHERE user_id = ? LIMIT 1`, [userId]);

    let cartId;
    if (!carts || carts.length === 0) {
        const result: any = await executeQuery(`INSERT INTO carts (user_id) VALUES (?)`, [userId]);
        cartId = result.insertId;
    } else {
        cartId = carts[0].id;
    }

    // Find the product variant by size
    const variant = await executeQuery<any[]>(
        `SELECT id, price FROM product_variants 
     WHERE product_id = ? AND size = ?`,
        [productId, size]
    );

    if (!variant || variant.length === 0) {
        throw new Error('Size không tồn tại');
    }

    const variantId = variant[0].id;
    const variantPrice = variant[0].price;

    // Kiểm tra xem item đã có trong cart chưa (check by variant_id if exists, else by product+size)
    const existing = await executeQuery<any[]>(
        `SELECT id, quantity FROM cart_items 
     WHERE cart_id = ? AND (
       (product_variant_id = ?) OR 
       (product_variant_id IS NULL AND product_id = ? AND size = ?)
     )`,
        [cartId, variantId, productId, size]
    );

    if (existing && existing.length > 0) {
        // Cập nhật số lượng và variant_id nếu chưa có
        await executeQuery(
            `UPDATE cart_items 
       SET quantity = quantity + ?, 
           product_variant_id = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
            [quantity, variantId, existing[0].id]
        );
    } else {
        // Thêm mới với product_variant_id
        await executeQuery(
            `INSERT INTO cart_items (cart_id, product_id, product_variant_id, size, quantity, price) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [cartId, productId, variantId, size, quantity, variantPrice]
        );
    }
}

export async function getCart(userId: number) {
    const query = `
    SELECT 
      ci.id,
      ci.cart_id,
      p.id as product_id,
      p.name,
      p.base_price as price,
      p.retail_price as sale_price,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url,
      ci.size,
      ci.quantity,
      ci.price as item_price,
      ci.product_variant_id,
      pv.sku,
      i.quantity as stock_quantity,
      i.reserved as stock_reserved,
      (COALESCE(i.quantity, 0) - COALESCE(i.reserved, 0)) as available
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
    LEFT JOIN inventory i ON i.product_variant_id = pv.id
    WHERE c.user_id = ?
    ORDER BY ci.added_at DESC`;

    return executeQuery(query, [userId]);
}

export async function removeFromCart(cartItemId: number) {
    await executeQuery(`DELETE FROM cart_items WHERE id = ?`, [cartItemId]);
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number) {
    if (quantity <= 0) {
        await removeFromCart(cartItemId);
    } else {
        await executeQuery(
            `UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [quantity, cartItemId]
        );
    }
}

export async function clearCart(userId: number) {
    await executeQuery(
        `DELETE ci FROM cart_items ci 
     JOIN carts c ON ci.cart_id = c.id 
     WHERE c.user_id = ?`,
        [userId]
    );
}
