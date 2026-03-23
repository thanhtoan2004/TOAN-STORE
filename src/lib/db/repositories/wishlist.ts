import { db } from '../drizzle';
import { wishlists, wishlistItems, products, productImages, categories, users } from '../schema';
import { eq, and, sql, desc, lt, isNotNull } from 'drizzle-orm';

/**
 * Thêm sản phẩm vào DB Wishlist.
 */
export async function addToWishlist(userId: number, productId: number) {
  // Tìm hoặc tạo wishlist cho user
  const [wishlist] = await db
    .select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.isDefault, 1)))
    .limit(1);

  let wishlistId: number;
  if (!wishlist) {
    const [result] = await db.insert(wishlists).values({
      userId,
      name: 'My Wishlist',
      isDefault: 1,
    });
    wishlistId = result.insertId;
  } else {
    wishlistId = wishlist.id;
  }

  // Thêm sản phẩm vào wishlist (IGNORE nếu đã tồn tại)
  await db.insert(wishlistItems).ignore().values({
    wishlistId,
    productId,
  });
}

/**
 * Trích xuất toàn bộ sản phẩm yêu thích của 1 User.
 */
export async function getWishlist(userId: number) {
  return await db
    .select({
      wishlistItemId: wishlistItems.id,
      id: products.id,
      name: products.name,
      slug: products.slug,
      category: sql<string>`(SELECT name FROM ${categories} WHERE id = ${products.categoryId})`,
      price: products.priceCache,
      sale_price: products.msrpPrice,
      image_url: sql<string>`(SELECT url FROM ${productImages} WHERE product_id = ${products.id} AND is_main = 1 LIMIT 1)`,
      is_new_arrival: sql<boolean>`(${products.createdAt} >= DATE_SUB(NOW(), INTERVAL 30 DAY))`,
      addedAt: wishlistItems.addedAt,
    })
    .from(wishlistItems)
    .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(and(eq(wishlists.userId, userId), eq(wishlists.isDefault, 1)))
    .orderBy(desc(wishlistItems.addedAt));
}

export async function removeFromWishlist(userId: number, productId: number) {
  // Drizzle doesn't support JOIN in DELETE for MySQL directly with simple API
  // Use a subquery
  const wishlistIdSubquery = db
    .select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.isDefault, 1)));

  await db
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.productId, productId),
        sql`${wishlistItems.wishlistId} IN (${wishlistIdSubquery})`
      )
    );
}

/**
 * Lấy ra các sản phẩm trong wishlist CÓ GIÁ GIẢM SO VỚI LÚC THÊM VÀO.
 * Ghi chú: Chức năng này bị vô hiệu hóa tạm thời vì DB chưa hỗ trợ cột price_when_added.
 */
export async function getWishlistItemsWithPriceDrop() {
  return [];
}
