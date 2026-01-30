import mysql from 'mysql2/promise';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  description: string | null;
  image_url: string;
  category: string;
  colors: number;
  is_new_arrival: boolean;
  created_at: Date;
  updated_at: Date;
}
// Tạo pool kết nối MySQL
// Chỉ set password nếu có giá trị (không phải undefined hoặc chuỗi rỗng)
const dbPassword = process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== ''
  ? process.env.DB_PASSWORD
  : undefined;

// Tạo config object, chỉ thêm password nếu có giá trị
const poolConfig: any = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'nike_clone',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Chỉ thêm password vào config nếu có giá trị
if (dbPassword !== undefined) {
  poolConfig.password = dbPassword;
}

const pool = mysql.createPool(poolConfig);

// Kiểm tra kết nối
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Kết nối MySQL thành công!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Không thể kết nối đến MySQL:', error);
    return false;
  }
}

// Khởi tạo database
async function initDb() {
  try {
    const connection = await pool.getConnection();

    // Tạo bảng users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        is_active TINYINT(1) DEFAULT 1,
        is_verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng settings phục vụ trang admin/settings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng products
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(100) UNIQUE,
        name VARCHAR(500) NOT NULL,
        slug VARCHAR(512) NOT NULL UNIQUE,
        short_description TEXT,
        description LONGTEXT,
        brand_id BIGINT UNSIGNED,
        category_id BIGINT UNSIGNED,
        collection_id BIGINT UNSIGNED,
        base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
        retail_price DECIMAL(12,2) DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng product_sizes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_sizes (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT UNSIGNED NOT NULL,
        size VARCHAR(10) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        reserved INT NOT NULL DEFAULT 0,
        price_adjustment DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY uk_product_size (product_id, size),
        INDEX idx_stock (stock)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng product_images
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT UNSIGNED NOT NULL,
        url VARCHAR(1000) NOT NULL,
        alt_text VARCHAR(255),
        position INT DEFAULT 0,
        is_main TINYINT(1) DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng carts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NULL,
        session_id VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_session_id (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng cart_items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        cart_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        size VARCHAR(10) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(12, 2) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_cart_id (cart_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng wishlists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(255) DEFAULT 'My Wishlist',
        is_default TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng wishlist_items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        wishlist_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY uk_wishlist_product (wishlist_id, product_id),
        INDEX idx_wishlist_id (wishlist_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng orders
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NULL,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        total DECIMAL(12, 2) NOT NULL,
        shipping_fee DECIMAL(12, 2) DEFAULT 0,
        discount DECIMAL(12, 2) DEFAULT 0,
        tax DECIMAL(12, 2) DEFAULT 0,
        subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
        shipping_address TEXT NOT NULL,
        billing_address TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        payment_method VARCHAR(50),
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        notes TEXT,
        placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_order_number (order_number),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng order_items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NULL,
        product_name VARCHAR(500) NOT NULL,
        product_image VARCHAR(1000),
        size VARCHAR(10) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        total DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng contact_messages
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'in_progress', 'resolved', 'closed') DEFAULT 'new',
        user_id BIGINT UNSIGNED NULL,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng gift_cards
    await connection.query(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        card_number VARCHAR(16) NOT NULL UNIQUE,
        pin VARCHAR(4) NOT NULL,
        initial_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
        current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'VND',
        status ENUM('active', 'inactive', 'expired', 'used') DEFAULT 'active',
        purchased_by BIGINT UNSIGNED NULL,
        purchased_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (purchased_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_card_number (card_number),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng admin_users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role ENUM('super_admin', 'admin', 'manager', 'support') DEFAULT 'admin',
        is_active TINYINT(1) DEFAULT 1,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng product_reviews
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title VARCHAR(255),
        comment TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        is_verified_purchase TINYINT(1) DEFAULT 0,
        helpful_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_id (product_id),
        INDEX idx_status (status),
        INDEX idx_rating (rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Khởi tạo cơ sở dữ liệu thành công');
    connection.release();
    return true;
  } catch (error) {
    console.error('Lỗi khởi tạo cơ sở dữ liệu:', error);
    return false;
  }
}

// Hàm thực thi truy vấn
async function executeQuery<T = unknown[]>(query: string, params: (string | number | null)[] = []): Promise<T> {
  try {
    const [rows] = await pool.query(query, params);
    return rows as T;
  } catch (error) {
    console.error('Lỗi thực thi truy vấn:', error);
    throw error;
  }
}

// Cart functions
async function addToCart(userId: number, productId: number, size: string, quantity: number = 1) {
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

async function getCart(userId: number) {
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

async function removeFromCart(cartItemId: number) {
  await executeQuery(`DELETE FROM cart_items WHERE id = ?`, [cartItemId]);
}

async function updateCartItemQuantity(cartItemId: number, quantity: number) {
  if (quantity <= 0) {
    await removeFromCart(cartItemId);
  } else {
    await executeQuery(
      `UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [quantity, cartItemId]
    );
  }
}

async function clearCart(userId: number) {
  await executeQuery(
    `DELETE ci FROM cart_items ci 
     JOIN carts c ON ci.cart_id = c.id 
     WHERE c.user_id = ?`,
    [userId]
  );
}

// Wishlist functions
async function addToWishlist(userId: number, productId: number) {
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

  // Thêm sản phẩm vào wishlist (IGNORE nếu đã tồn tại)
  await executeQuery(
    `INSERT IGNORE INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)`,
    [wishlistId, productId]
  );
}

async function getWishlist(userId: number) {
  const query = `
    SELECT 
      wi.id as wishlist_item_id,
      p.id,
      p.name,
      p.base_price as price,
      p.retail_price as sale_price,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url,
      (SELECT name FROM categories WHERE id = p.category_id) as category,
      wi.added_at
    FROM wishlist_items wi
    JOIN wishlists w ON wi.wishlist_id = w.id
    JOIN products p ON wi.product_id = p.id
    WHERE w.user_id = ? AND w.is_default = 1
    ORDER BY wi.added_at DESC`;

  return executeQuery(query, [userId]);
}

async function removeFromWishlist(userId: number, productId: number) {
  await executeQuery(
    `DELETE wi FROM wishlist_items wi 
     JOIN wishlists w ON wi.wishlist_id = w.id 
     WHERE w.user_id = ? AND wi.product_id = ?`,
    [userId, productId]
  );
}

// Product functions
async function getProductSizes(productId: number) {
  return executeQuery(`
    SELECT size, stock, reserved, price_adjustment
    FROM product_sizes 
    WHERE product_id = ?
    ORDER BY CAST(size AS DECIMAL(10,1))`,
    [productId]
  );
}

async function getProductById(productId: number) {
  const [product] = await executeQuery<any[]>(`
    SELECT * FROM products WHERE id = ? AND is_active = 1`,
    [productId]
  );
  return product;
}

async function getProducts(filters: {
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
    WHERE p.is_active = 1`;
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

// Contact message functions
async function saveContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: number;
}) {
  const query = `
    INSERT INTO contact_messages (name, email, subject, message, user_id, status)
    VALUES (?, ?, ?, ?, ?, 'new')`;

  return executeQuery(query, [
    data.name,
    data.email,
    data.subject,
    data.message,
    data.userId || null
  ]);
}

// Gift card functions
async function checkGiftCardBalance(cardNumber: string, pin: string) {
  const cards = await executeQuery<any[]>(
    `SELECT current_balance, status, expires_at FROM gift_cards 
     WHERE card_number = ? AND pin = ? AND status = 'active'`,
    [cardNumber, pin]
  );

  if (!cards || cards.length === 0) {
    return null;
  }

  return cards[0];
}

// Order functions
async function createOrder(orderData: {
  userId?: number;
  orderNumber: string;
  totalAmount: number;
  shippingFee?: number;
  discount?: number;
  tax?: number;
  voucherCode?: string | null;
  voucherDiscount?: number;
  giftcardNumber?: string | null;
  giftcardDiscount?: number;
  shippingAddress: string | { name: string; phone: string; address: string; city: string; district: string; ward: string };
  phone: string;
  email: string;
  paymentMethod?: string;
  notes?: string;
  items: Array<{
    productId: number;
    productName: string;
    productImage: string;
    size: string;
    quantity: number;
    price: number;
  }>;
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const shippingFee = orderData.shippingFee || 0;
    const discount = orderData.discount || 0;
    const tax = orderData.tax || 0;
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Parse shipping address
    let shippingAddr: { name: string; phone: string; address: string; city: string; district: string; ward: string };
    if (typeof orderData.shippingAddress === 'string') {
      try {
        shippingAddr = JSON.parse(orderData.shippingAddress);
      } catch {
        // Nếu parse lỗi, tạo object mặc định
        shippingAddr = {
          name: orderData.phone,
          phone: orderData.phone,
          address: orderData.shippingAddress,
          city: '',
          district: '',
          ward: ''
        };
      }
    } else {
      shippingAddr = orderData.shippingAddress;
    }

    // Tạo shipping address
    const addressLine = `${shippingAddr.address}, ${shippingAddr.ward}, ${shippingAddr.district}`;
    const [addressResult]: any = await connection.execute(
      `INSERT INTO user_addresses (user_id, recipient_name, phone, address_line, city, state, is_default)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        orderData.userId || null,
        shippingAddr.name,
        shippingAddr.phone,
        addressLine,
        shippingAddr.city || '',
        shippingAddr.district || ''
      ]
    );

    const shippingAddressId = addressResult.insertId;

    // Tạo order
    const [orderResult]: any = await connection.execute(
      `INSERT INTO orders (user_id, order_number, subtotal, shipping_fee, discount, voucher_code, voucher_discount, giftcard_number, giftcard_discount, tax, total, shipping_address_id, status, placed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        orderData.userId || null,
        orderData.orderNumber,
        subtotal,
        shippingFee,
        discount,
        orderData.voucherCode || null,
        orderData.voucherDiscount || 0,
        orderData.giftcardNumber || null,
        orderData.giftcardDiscount || 0,
        tax,
        subtotal + shippingFee - discount + tax,
        shippingAddressId
      ]
    );

    const orderId = orderResult.insertId;

    // Tạo order items
    for (const item of orderData.items) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, size, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.productName,
          item.size,
          item.quantity,
          item.price,
          item.price * item.quantity
        ]
      );

      // Cập nhật inventory - tìm variant_id từ product_id và size
      const [variants]: any = await connection.execute(
        `SELECT id FROM product_variants WHERE product_id = ? AND size = ? LIMIT 1`,
        [item.productId, item.size]
      );

      if (variants.length > 0) {
        const variantId = variants[0].id;
        await connection.execute(
          `UPDATE inventory 
           SET quantity = quantity - ?, reserved = reserved - ?
           WHERE product_variant_id = ? AND quantity >= ?`,
          [item.quantity, item.quantity, variantId, item.quantity]
        );
      }
    }

    // Track coupon usage if voucher was used
    if (orderData.voucherCode && orderData.userId) {
      // Get coupon id from code
      const [coupons]: any = await connection.execute(
        `SELECT id FROM coupons WHERE code = ? LIMIT 1`,
        [orderData.voucherCode]
      );

      if (coupons.length > 0) {
        const couponId = coupons[0].id;
        // Create usage record (marked as pending until order is delivered)
        await connection.execute(
          `INSERT INTO coupon_usage (coupon_id, user_id, order_id, used_at)
           VALUES (?, ?, ?, NOW())`,
          [couponId, orderData.userId, orderId]
        );
      }
    }

    // Note: Gift card balance will be deducted when order status changes to 'delivered'
    // This is handled in the order status update endpoint

    await connection.commit();
    return orderId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getOrdersByUserId(userId: number) {
  const query = `
    SELECT 
      o.*,
      COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.placed_at DESC`;

  return executeQuery(query, [userId]);
}

async function getOrderByNumber(orderNumber: string) {
  const orders = await executeQuery<any[]>(
    `SELECT 
      o.*,
      ua.recipient_name as shipping_name,
      ua.phone as shipping_phone,
      ua.address_line as shipping_address,
      ua.city as shipping_city,
      ua.state as shipping_district,
      ua.postal_code as shipping_postal_code
    FROM orders o
    LEFT JOIN user_addresses ua ON o.shipping_address_id = ua.id
    WHERE o.order_number = ?`,
    [orderNumber]
  );

  if (!orders || orders.length === 0) {
    return [];
  }

  const items = await executeQuery(
    'SELECT * FROM order_items WHERE order_id = ?',
    [orders[0].id]
  );

  return [{
    ...orders[0],
    items
  }];
}

async function updateOrderStatus(orderNumber: string, status: string) {
  await executeQuery(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?',
    [status, orderNumber]
  );
}

async function cancelOrder(orderNumber: string) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lấy order info
    const [order] = await connection.execute<any[]>(
      'SELECT id, status FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (!order || order.length === 0) {
      throw new Error('Order not found');
    }

    if (order[0].status !== 'pending') {
      throw new Error('Can only cancel pending orders');
    }

    // Lấy order items
    const [items] = await connection.execute<any[]>(
      'SELECT product_id, size, quantity FROM order_items WHERE order_id = ?',
      [order[0].id]
    );

    // Hoàn lại stock
    for (const item of items as any[]) {
      await connection.execute(
        `UPDATE product_sizes 
         SET stock = stock + ?, reserved = reserved - ?
         WHERE product_id = ? AND size = ?`,
        [item.quantity, item.quantity, item.product_id, item.size]
      );
    }

    // Cập nhật status
    await connection.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?',
      ['cancelled', orderNumber]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Store functions
async function getStores(city?: string) {
  let query = `
    SELECT 
      s.id,
      s.name,
      s.address,
      s.city,
      s.state,
      s.phone,
      s.email,
      s.latitude,
      s.longitude,
      s.description,
      GROUP_CONCAT(
        CONCAT(
          CASE sh.day_of_week
            WHEN 0 THEN 'CN'
            WHEN 1 THEN 'T2'
            WHEN 2 THEN 'T3'
            WHEN 3 THEN 'T4'
            WHEN 4 THEN 'T5'
            WHEN 5 THEN 'T6'
            WHEN 6 THEN 'T7'
          END,
          ': ',
          CASE 
            WHEN sh.is_closed = 1 THEN 'Đóng cửa'
            ELSE CONCAT(TIME_FORMAT(sh.open_time, '%H:%i'), ' - ', TIME_FORMAT(sh.close_time, '%H:%i'))
          END
        )
        ORDER BY sh.day_of_week
        SEPARATOR ' | '
      ) as hours
    FROM stores s
    LEFT JOIN store_hours sh ON s.id = sh.store_id
    WHERE s.is_active = 1
  `;

  const params: any[] = [];
  if (city) {
    query += ' AND s.city LIKE ?';
    params.push(`%${city}%`);
  }

  query += ' GROUP BY s.id ORDER BY s.city, s.name';

  return executeQuery(query, params);
}

export {
  pool,
  testConnection,
  initDb,
  executeQuery,
  // Cart functions
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  // Wishlist functions
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  // Product functions
  getProductSizes,
  getProductById,
  getProducts,
  // Contact functions
  saveContactMessage,
  // Gift card functions
  checkGiftCardBalance,
  // Order functions
  createOrder,
  getOrdersByUserId,
  getOrderByNumber,
  updateOrderStatus,
  cancelOrder,
  // User Address functions
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  // Store functions
  getStores
};

// User Address functions
async function getUserAddresses(userId: number) {
  return executeQuery(
    `SELECT * FROM user_addresses 
     WHERE user_id = ? 
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
}

async function addUserAddress(userId: number, address: {
  label?: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}) {
  // Nếu đây là địa chỉ mặc định, bỏ default của các địa chỉ khác
  if (address.is_default) {
    await executeQuery(
      'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
      [userId]
    );
  }

  const result = await executeQuery(
    `INSERT INTO user_addresses 
     (user_id, label, recipient_name, phone, address_line, city, state, postal_code, country, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      address.label || null,
      address.recipient_name,
      address.phone,
      address.address_line,
      address.city,
      address.state || null,
      address.postal_code || null,
      address.country || 'Vietnam',
      address.is_default ? 1 : 0
    ]
  );

  return result;
}

async function updateUserAddress(addressId: number, userId: number, address: {
  label?: string;
  recipient_name?: string;
  phone?: string;
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}) {
  // Nếu đây là địa chỉ mặc định, bỏ default của các địa chỉ khác
  if (address.is_default) {
    await executeQuery(
      'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
      [userId]
    );
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (address.label !== undefined) {
    fields.push('label = ?');
    values.push(address.label);
  }
  if (address.recipient_name !== undefined) {
    fields.push('recipient_name = ?');
    values.push(address.recipient_name);
  }
  if (address.phone !== undefined) {
    fields.push('phone = ?');
    values.push(address.phone);
  }
  if (address.address_line !== undefined) {
    fields.push('address_line = ?');
    values.push(address.address_line);
  }
  if (address.city !== undefined) {
    fields.push('city = ?');
    values.push(address.city);
  }
  if (address.state !== undefined) {
    fields.push('state = ?');
    values.push(address.state);
  }
  if (address.postal_code !== undefined) {
    fields.push('postal_code = ?');
    values.push(address.postal_code);
  }
  if (address.country !== undefined) {
    fields.push('country = ?');
    values.push(address.country);
  }
  if (address.is_default !== undefined) {
    fields.push('is_default = ?');
    values.push(address.is_default ? 1 : 0);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(addressId, userId);

  await executeQuery(
    `UPDATE user_addresses SET ${fields.join(', ')} 
     WHERE id = ? AND user_id = ?`,
    values
  );
}

async function deleteUserAddress(addressId: number, userId: number) {
  await executeQuery(
    'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
    [addressId, userId]
  );
}

async function setDefaultAddress(addressId: number, userId: number) {
  // Bỏ default của tất cả địa chỉ
  await executeQuery(
    'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
    [userId]
  );

  // Set địa chỉ này làm mặc định
  await executeQuery(
    'UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?',
    [addressId, userId]
  );
}

// Export helper for transactions
export async function getConnection() {
  return pool.getConnection();
}

// Export query helper
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}
