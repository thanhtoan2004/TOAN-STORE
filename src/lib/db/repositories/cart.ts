import { db } from '../drizzle';
import { carts, cartItems, productVariants, products, productImages, inventory } from '../schema';
import { eq, and, sql, desc, or } from 'drizzle-orm';

/**
 * Thêm sản phẩm vào giỏ hàng của user.
 */
export async function addToCart(
  userId: number,
  productId: number,
  size: string,
  quantity: number = 1
) {
  // Tìm hoặc tạo cart cho user
  const [cart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);

  let cartId: number;
  if (!cart) {
    const [result] = await db.insert(carts).values({ userId });
    cartId = result.insertId;
  } else {
    cartId = cart.id;
  }

  // Find the product variant by size
  const [variant] = await db
    .select({ id: productVariants.id, price: productVariants.price })
    .from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.size, size)))
    .limit(1);

  if (!variant) {
    throw new Error('Size không tồn tại');
  }

  const variantId = variant.id;
  const variantPrice = variant.price;

  // Kiểm tra xem item đã có trong cart chưa
  const [existing] = await db
    .select({ id: cartItems.id, quantity: cartItems.quantity })
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cartId),
        or(
          eq(cartItems.productVariantId, variantId),
          and(
            sql`${cartItems.productVariantId} IS NULL`,
            eq(cartItems.productId, productId),
            eq(cartItems.size, size)
          )
        )
      )
    )
    .limit(1);

  if (existing) {
    // Cập nhật số lượng và variant_id nếu chưa có (Drizzle update)
    await db
      .update(cartItems)
      .set({
        quantity: sql`${cartItems.quantity} + ${quantity}`,
        productVariantId: variantId,
      })
      .where(eq(cartItems.id, existing.id));
  } else {
    // Thêm mới
    await db.insert(cartItems).values({
      cartId,
      productId,
      productVariantId: variantId,
      size,
      quantity,
      price: variantPrice ? String(variantPrice) : '0',
    });
  }
}

/**
 * Lấy danh sách toàn bộ sản phẩm đang có trong giỏ hàng của User.
 */
export async function getCart(userId: number) {
  // Inventory subquery
  const inventorySubquery = db
    .select({
      productVariantId: inventory.productVariantId,
      quantity: sql<number>`SUM(${inventory.quantity})`.as('quantity'),
      reserved: sql<number>`SUM(${inventory.reserved})`.as('reserved'),
    })
    .from(inventory)
    .groupBy(inventory.productVariantId)
    .as('i');

  return await db
    .select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      productId: products.id,
      slug: products.slug,
      name: products.name,
      price: products.priceCache,
      salePrice: products.msrpPrice,
      imageUrl: sql<string>`(SELECT url FROM ${productImages} WHERE product_id = ${products.id} AND is_main = 1 LIMIT 1)`,
      size: cartItems.size,
      quantity: cartItems.quantity,
      itemPrice: cartItems.price,
      productVariantId: cartItems.productVariantId,
      sku: productVariants.sku,
      stockQuantity: sql<number>`i.quantity`,
      stockReserved: sql<number>`i.reserved`,
      available: sql<number>`COALESCE(i.quantity, 0) - COALESCE(i.reserved, 0)`,
    })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
    .leftJoin(inventorySubquery, eq(cartItems.productVariantId, inventorySubquery.productVariantId))
    .where(eq(carts.userId, userId))
    .orderBy(desc(cartItems.addedAt));
}

export async function removeFromCart(cartItemId: number, userId: number) {
  const cartIdSubquery = db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId));

  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, cartItemId), sql`${cartItems.cartId} IN (${cartIdSubquery})`));
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number, userId: number) {
  if (quantity <= 0) {
    await removeFromCart(cartItemId, userId);
  } else {
    const cartIdSubquery = db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId));

    await db
      .update(cartItems)
      .set({
        quantity,
      })
      .where(and(eq(cartItems.id, cartItemId), sql`${cartItems.cartId} IN (${cartIdSubquery})`));
  }
}

export async function clearCart(userId: number) {
  const cartIdSubquery = db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId));

  await db.delete(cartItems).where(sql`${cartItems.cartId} IN (${cartIdSubquery})`);
}

/**
 * Thêm hàng loạt sản phẩm vào giỏ hàng (Tối ưu cho Reorder).
 */
export async function bulkAddToCart(
  userId: number,
  items: { productId: number; size: string; quantity: number }[]
) {
  const results = {
    addedCount: 0,
    skippedItems: [] as any[],
  };

  for (const item of items) {
    try {
      await addToCart(userId, item.productId, item.size, item.quantity);
      results.addedCount++;
    } catch (error: any) {
      results.skippedItems.push({
        productId: item.productId,
        size: item.size,
        reason: error.message,
      });
    }
  }

  return results;
}
