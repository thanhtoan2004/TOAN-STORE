import { executeQuery } from '../connection';

/**
 * Thêm sản phẩm vào DB Wishlist.
 * Tương tự Cart, hệ thống sẽ tạo một "Default Wishlist" nấp bóng ẩn danh dưới ID của user nếu chưa từng có.
 * Dùng lệnh `INSERT IGNORE` của MySQL để chặn lỗi trùng lặp nếu User bấm tim 2 lần.
 */
export async function addToWishlist(userId: number, productId: number) {
  // Tìm hoặc tạo wishlist cho user
  const wishlists = await executeQuery<any[]>(
    `SELECT id FROM wishlists WHERE user_id = ? AND is_default = 1 LIMIT 1`,
    [userId]
  );

  let wishlistId;
  if (!wishlists || wishlists.length === 0) {
    const result: any = await executeQuery(
      `INSERT INTO wishlists (user_id, name, is_default) VALUES (?, 'My Wishlist', 1)`,
      [userId]
    );
    wishlistId = result.insertId;
  } else {
    wishlistId = wishlists[0].id;
  }

  // Thêm sản phẩm vào wishlist (IGNORE nếu đã tồn tại) kèm theo giá gốc tại thời điểm thêm
  await executeQuery(
    `INSERT IGNORE INTO wishlist_items (wishlist_id, product_id, price_when_added) 
         SELECT ?, ?, COALESCE(msrp_price, price_cache) 
         FROM products WHERE id = ?`,
    [wishlistId, productId, productId]
  );
}

/**
 * Trích xuất toàn bộ sản phẩm yêu thích của 1 User.
 * Lưu ý: Logic lấy mác "Hàng Mới" ở đây đang được fix cứng theo hàm DATE_SUB(NOW(), 30 DAY).
 * Tức là cứ giày nào mới publish trong 30 ngày gần nhất thì tự động có mác "Hàng Mới".
 */
export async function getWishlist(userId: number) {
  const query = `
    SELECT 
      wi.id as wishlist_item_id,
      p.id,
      p.name,
      p.slug,
      p.price_cache as price,
      p.msrp_price as sale_price,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url,
      (SELECT name FROM categories WHERE id = p.category_id) as category,
      (p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as is_new_arrival,
      wi.added_at
    FROM wishlist_items wi
    JOIN wishlists w ON wi.wishlist_id = w.id
    JOIN products p ON wi.product_id = p.id
    WHERE w.user_id = ? AND w.is_default = 1
    ORDER BY wi.added_at DESC`;

  return executeQuery(query, [userId]);
}

export async function removeFromWishlist(userId: number, productId: number) {
  await executeQuery(
    `DELETE wi FROM wishlist_items wi 
     JOIN wishlists w ON wi.wishlist_id = w.id 
     WHERE w.user_id = ? AND wi.product_id = ?`,
    [userId, productId]
  );
}

/**
 * Lấy ra các sản phẩm trong wishlist của tất cả mọi người có giá hiện tại RẺ HƠN giá lúc họ thêm vào.
 * Dùng cho CronJob gửi email thông báo Price Drop.
 */
export async function getWishlistItemsWithPriceDrop() {
  const query = `
    SELECT 
      u.id as user_id,
      u.email,
      u.first_name,
      p.id as product_id,
      p.name as product_name,
      p.slug as product_slug,
      wi.price_when_added,
      p.price_cache as current_price,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
    FROM wishlist_items wi
    JOIN wishlists w ON wi.wishlist_id = w.id
    JOIN users u ON w.user_id = u.id
    JOIN products p ON wi.product_id = p.id
    WHERE 
      wi.price_when_added IS NOT NULL 
      AND p.price_cache < wi.price_when_added
      AND p.is_active = 1
    ORDER BY u.id ASC
    `;

  return executeQuery<any[]>(query, []);
}
