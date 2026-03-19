import { db } from '../drizzle';
import { wishlists, wishlistItems, products, productImages, categories, users } from '../schema';
import { eq, and, sql, desc, lt, isNotNull } from 'drizzle-orm';

/**
 * Thêm sản phẩm vào DB Wishlist.
 */
export async function addToWishlist(userId: number, productId: number) {
  // Tìm hoặc tạo wishlist cho user
  let [wishlist] = await db
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

  // Thêm sản phẩm vào wishlist (IGNORE nếu đã tồn tại) kèm theo giá gốc tại thời điểm thêm
  await db
    .insert(wishlistItems)
    .ignore()
    .values({
      wishlistId,
      productId,
      priceWhenAdded: sql`(SELECT COALESCE(msrp_price, price_cache) FROM ${products} WHERE id = ${productId})`,
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
 * Lấy ra các sản phẩm trong wishlist của tất cả mọi người có giá hiện tại RẺ HƠN giá lúc họ thêm vào.
 */
export async function getWishlistItemsWithPriceDrop() {
  return await db
    .select({
      userId: users.id,
      email: users.email,
      firstName: users.firstName,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      priceWhenAdded: wishlistItems.priceWhenAdded,
      currentPrice: products.priceCache,
      imageUrl: sql<string>`(SELECT url FROM ${productImages} WHERE product_id = ${products.id} AND is_main = 1 LIMIT 1)`,
    })
    .from(wishlistItems)
    .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
    .innerJoin(users, eq(wishlists.userId, users.id))
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(
      and(
        isNotNull(wishlistItems.priceWhenAdded),
        lt(products.priceCache, wishlistItems.priceWhenAdded),
        eq(products.isActive, 1)
      )
    )
    .orderBy(users.id);
}
