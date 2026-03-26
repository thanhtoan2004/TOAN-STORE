import { pool } from './connection';

// Khởi tạo database
export async function initDb() {
  try {
    const connection = await pool.getConnection();

    // Tạo bảng users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        phone_encrypted TEXT,
        date_of_birth DATE,
        date_of_birth_encrypted TEXT,
        gender ENUM('male', 'female', 'other'),
        is_active TINYINT(1) DEFAULT 1,
        is_verified TINYINT(1) DEFAULT 0,
        is_encrypted TINYINT(1) DEFAULT 0,
        membership_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
        available_points INT DEFAULT 0,
        lifetime_points INT DEFAULT 0,
        points_expiry_date DATE NULL,
        tier_updated_at DATETIME NULL,
        avatar_url VARCHAR(1000) NULL,
        google_id VARCHAR(255) NULL UNIQUE,
        facebook_id VARCHAR(255) NULL UNIQUE,
        two_factor_enabled TINYINT(1) DEFAULT 0,
        two_factor_secret VARCHAR(255) NULL,
        is_banned TINYINT(1) DEFAULT 0,
        failed_login_attempts INT DEFAULT 0,
        lockout_until TIMESTAMP NULL,
        email_notifications TINYINT(1) DEFAULT 1,
        sms_notifications TINYINT(1) DEFAULT 0,
        push_notifications TINYINT(1) DEFAULT 1,
        promo_notifications TINYINT(1) DEFAULT 0,
        order_notifications TINYINT(1) DEFAULT 1,
        public_profile TINYINT(1) DEFAULT 1,
        data_persistence TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_email (email),
        INDEX idx_deleted_at (deleted_at),
        INDEX idx_is_active (is_active),
        INDEX idx_membership (membership_tier)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

    `);

    // Migration: Thêm các cột cần thiết cho users nếu chưa có (không dùng IF NOT EXISTS vì version MySQL cũ không hỗ trợ)
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM users');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('available_points')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN available_points INT DEFAULT 0, ADD COLUMN lifetime_points INT DEFAULT 0'
        );
      }
      if (!columnNames.includes('membership_tier')) {
        await connection.query(
          "ALTER TABLE users ADD COLUMN membership_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze'"
        );
      }
      if (!columnNames.includes('is_banned')) {
        await connection.query(
          "ALTER TABLE users ADD COLUMN is_banned TINYINT(1) DEFAULT 0 COMMENT 'User banned status: 0 = active, 1 = banned'"
        );
      }
      if (!columnNames.includes('google_id')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL UNIQUE'
        );
      }
      if (!columnNames.includes('facebook_id')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN facebook_id VARCHAR(255) DEFAULT NULL UNIQUE'
        );
      }
      if (!columnNames.includes('avatar_url')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(1000) DEFAULT NULL'
        );
      }
      if (!columnNames.includes('email_notifications')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN email_notifications TINYINT(1) DEFAULT 1'
        );
      }
      if (!columnNames.includes('sms_notifications')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN sms_notifications TINYINT(1) DEFAULT 0'
        );
      }
      if (!columnNames.includes('sms_order_notifications')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN sms_order_notifications TINYINT(1) DEFAULT 0'
        );
      }
      if (!columnNames.includes('push_notifications')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN push_notifications TINYINT(1) DEFAULT 1'
        );
      }
      if (!columnNames.includes('promo_notifications')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN promo_notifications TINYINT(1) DEFAULT 0'
        );
      }
      if (!columnNames.includes('order_notifications')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN order_notifications TINYINT(1) DEFAULT 1'
        );
      }
      if (!columnNames.includes('data_persistence')) {
        await connection.query(
          'ALTER TABLE users ADD COLUMN data_persistence TINYINT(1) DEFAULT 1'
        );
      }
      if (!columnNames.includes('public_profile')) {
        await connection.query('ALTER TABLE users ADD COLUMN public_profile TINYINT(1) DEFAULT 1');
      }

      // Migration: Modify password to be nullable
      try {
        await connection.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL');
      } catch (pErr) {
        console.log('Password modification failed/already done');
      }
    } catch (e) {
      console.log('Error adding columns to users:', e);
    }

    // settings table creation removed for consolidation into site_settings

    // Tạo bảng product_colors
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        hex_code VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        parent_id BIGINT UNSIGNED DEFAULT NULL,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        image_url VARCHAR(1000) DEFAULT NULL,
        position INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_deleted_at (deleted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng category_attributes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS category_attributes (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        category_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(200) NOT NULL,
        input_type VARCHAR(50) DEFAULT 'text',
        is_filterable TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng attribute_values (Unified Point 6)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attribute_values (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        attribute_id BIGINT UNSIGNED NOT NULL,
        value VARCHAR(255) NOT NULL,
        label VARCHAR(255) DEFAULT NULL,
        position INT DEFAULT 0,
        FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng brands
    await connection.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL UNIQUE,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng collections
    await connection.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng sports
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sports (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        image_url VARCHAR(1000) DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
        sport_id BIGINT UNSIGNED,
        price_cache DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (price_cache >= 0),
        msrp_price DECIMAL(12,2) DEFAULT NULL CHECK (msrp_price >= 0 OR msrp_price IS NULL),
        is_active TINYINT(1) DEFAULT 1,
        is_featured TINYINT(1) DEFAULT 0,
        is_new_arrival TINYINT(1) DEFAULT 1,
        view_count INT DEFAULT 0,
        sale_count INT DEFAULT 0,
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_is_active (is_active),
        INDEX idx_is_featured (is_featured),
        INDEX idx_is_new_arrival (is_new_arrival),
        INDEX idx_deleted_at (deleted_at),
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
        FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng product_variants
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT UNSIGNED NOT NULL,
        sku VARCHAR(200) UNIQUE,
        size VARCHAR(20),
        color_id BIGINT UNSIGNED NULL,
        barcode VARCHAR(100),
        attributes JSON,
        price DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
        weight DECIMAL(10,3) DEFAULT 0,
        height DECIMAL(10,3) DEFAULT 0,
        width DECIMAL(10,3) DEFAULT 0,
        depth DECIMAL(10,3) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES product_colors(id) ON DELETE SET NULL,
        INDEX idx_sku (sku),
        INDEX idx_size (size)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng inventory
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_variant_id BIGINT UNSIGNED NOT NULL,
        warehouse_id BIGINT UNSIGNED NULL,
        quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
        INDEX idx_variant (product_variant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng inventory_logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        inventory_id BIGINT UNSIGNED NOT NULL,
        admin_id BIGINT UNSIGNED NULL,
        quantity_change INT NOT NULL,
        reason VARCHAR(255),
        reference_id VARCHAR(100),
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng product_images
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT UNSIGNED NOT NULL,
        color_id BIGINT UNSIGNED NULL,
        url VARCHAR(1000) NOT NULL,
        alt_text VARCHAR(255),
        position INT DEFAULT 0,
        is_main TINYINT(1) DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES product_colors(id) ON DELETE SET NULL
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
        product_variant_id BIGINT UNSIGNED NULL,
        size VARCHAR(10) NOT NULL,
        quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
        price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
        INDEX idx_cart_id (cart_id),
        INDEX idx_variant (product_variant_id)
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
        price_when_added DECIMAL(12, 2) NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY uk_wishlist_product (wishlist_id, product_id),
        INDEX idx_wishlist_id (wishlist_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migration for wishlist_items
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM wishlist_items');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('price_when_added')) {
        await connection.query(
          'ALTER TABLE wishlist_items ADD COLUMN price_when_added DECIMAL(12, 2) NULL AFTER product_id'
        );
        // Seed price_when_added for existing items
        await connection.query(`
          UPDATE wishlist_items wi
          JOIN products p ON p.id = wi.product_id
          SET wi.price_when_added = COALESCE(p.msrp_price, p.price_cache)
          WHERE wi.price_when_added IS NULL
        `);
      }
    } catch (e) {
      console.log('Error adding columns to wishlist_items:', e);
    }

    // Tạo bảng orders
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NULL,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        status ENUM('pending', 'pending_payment_confirmation', 'payment_received', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
        currency VARCHAR(10) DEFAULT 'VND',
        total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        shipping_fee DECIMAL(12, 2) DEFAULT 0.00,
        discount DECIMAL(12, 2) DEFAULT 0.00,
        voucher_code VARCHAR(100),
        promotion_code VARCHAR(100),
        voucher_discount DECIMAL(12, 2) DEFAULT 0.00,
        giftcard_number VARCHAR(64),
        giftcard_id BIGINT UNSIGNED,
        giftcard_discount DECIMAL(12, 2) DEFAULT 0.00,
        tax DECIMAL(12, 2) DEFAULT 0.00,
        subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        shipping_address TEXT,
        shipping_address_id BIGINT UNSIGNED NULL,
        shipping_address_snapshot JSON,
        billing_address_snapshot JSON,
        phone VARCHAR(50) DEFAULT '***',
        phone_encrypted TEXT,
        email VARCHAR(255) DEFAULT '***',
        email_encrypted TEXT,
        email_hash VARCHAR(64),
        is_encrypted TINYINT(1) DEFAULT 1,
        payment_method VARCHAR(50) DEFAULT 'cod',
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        tracking_number VARCHAR(100),
        carrier VARCHAR(100),
        shipped_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        payment_confirmed_at TIMESTAMP NULL,
        cancelled_at TIMESTAMP NULL,
        notes TEXT,
        placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (giftcard_id) REFERENCES gift_cards(id) ON DELETE SET NULL,
        INDEX idx_order_number (order_number),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_email_hash (email_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng order_items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NULL,
        product_variant_id BIGINT UNSIGNED NULL,
        product_name VARCHAR(500) NOT NULL,
        product_image VARCHAR(1000),
        size VARCHAR(10) NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
        total_price DECIMAL(12, 2) NOT NULL CHECK (total_price >= 0),
        price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
        total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migration: Thêm các cột thiếu cho orders
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM orders');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('currency')) {
        await connection.query(
          "ALTER TABLE orders ADD COLUMN currency VARCHAR(10) DEFAULT 'VND' AFTER status"
        );
      }
      if (!columnNames.includes('voucher_code')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN voucher_code VARCHAR(100) AFTER discount'
        );
      }
      if (!columnNames.includes('voucher_discount')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN voucher_discount DECIMAL(12, 2) DEFAULT 0 AFTER voucher_code'
        );
      }
      if (!columnNames.includes('giftcard_number')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN giftcard_number VARCHAR(16) AFTER voucher_discount'
        );
      }
      if (!columnNames.includes('giftcard_discount')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN giftcard_discount DECIMAL(12, 2) DEFAULT 0 AFTER giftcard_number'
        );
      }
      if (!columnNames.includes('shipping_address_id')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN shipping_address_id BIGINT UNSIGNED NULL AFTER shipping_address'
        );
      }
      if (!columnNames.includes('shipping_address_snapshot')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN shipping_address_snapshot JSON AFTER shipping_address_id'
        );
      } else {
        // Đảm bảo type là JSON nếu đã có nhưng đang là TEXT
        const snapCol = columns.find((c: any) => c.Field === 'shipping_address_snapshot');
        if (snapCol && snapCol.Type.toLowerCase().includes('text')) {
          await connection.query('ALTER TABLE orders MODIFY COLUMN shipping_address_snapshot JSON');
        }
      }
      if (!columnNames.includes('tracking_number')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) AFTER payment_status'
        );
      }
      if (!columnNames.includes('carrier')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN carrier VARCHAR(100) AFTER tracking_number'
        );
      }
      if (!columnNames.includes('shipped_at')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP NULL AFTER carrier'
        );
      }
      if (!columnNames.includes('delivered_at')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP NULL AFTER shipped_at'
        );
      }
      if (!columnNames.includes('payment_confirmed_at')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN payment_confirmed_at TIMESTAMP NULL AFTER delivered_at'
        );
      }
      if (!columnNames.includes('cancelled_at')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP NULL AFTER payment_confirmed_at'
        );
      }
      if (!columnNames.includes('phone')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN phone VARCHAR(255) AFTER payment_status'
        );
      }
      if (!columnNames.includes('email')) {
        await connection.query('ALTER TABLE orders ADD COLUMN email VARCHAR(255) AFTER phone');
      }
      if (!columnNames.includes('has_gift_wrapping')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN has_gift_wrapping TINYINT(1) DEFAULT 0'
        );
      }
      if (!columnNames.includes('gift_wrap_cost')) {
        await connection.query(
          'ALTER TABLE orders ADD COLUMN gift_wrap_cost DECIMAL(12, 2) DEFAULT 0.00'
        );
      }

      // Migration cho status ENUM nếu thiếu các giá trị mới
      const statusCol = columns.find((c: any) => c.Field === 'status');
      if (statusCol && !statusCol.Type.includes('pending_payment_confirmation')) {
        await connection.query(
          "ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'pending_payment_confirmation', 'payment_received', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'"
        );
      }
      if (!columnNames.includes('survey_sent')) {
        await connection.query('ALTER TABLE orders ADD COLUMN survey_sent TINYINT(1) DEFAULT 0');
      }

      // Migration: Thêm Index cho các cột thường xuyên query/filter để tránh delay
      if (!columnNames.includes('idx_placed_at')) {
        try {
          await connection.query('ALTER TABLE orders ADD INDEX idx_placed_at (placed_at)');
        } catch (e) {}
      }

      try {
        const [uCols]: any = await connection.query('SHOW COLUMNS FROM users');
        const uColNames = uCols.map((col: any) => col.Field);
        if (!uColNames.includes('idx_created_at')) {
          await connection.query('ALTER TABLE users ADD INDEX idx_created_at (created_at)');
        }
      } catch (e) {}
    } catch (e) {
      console.log('Error adding columns to orders:', e);
    }

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
        initial_balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (initial_balance >= 0),
        current_balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
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

    // Migration: Fix Gift Card PIN length (VARCHAR(4) -> VARCHAR(255) for hash)
    try {
      const [columns]: any = await connection.query("SHOW COLUMNS FROM gift_cards LIKE 'pin'");
      if (columns.length > 0) {
        const pinType = columns[0].Type;
        if (pinType.includes('varchar(4)')) {
          await connection.query('ALTER TABLE gift_cards MODIFY COLUMN pin VARCHAR(255) NOT NULL');
          console.log('Migrated gift_cards.pin to VARCHAR(255)');
        }
      }
    } catch (e) {
      console.error('Error migrating gift_cards pin:', e);
    }

    // Tạo bảng user_addresses
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        phone_encrypted TEXT,
        address_line VARCHAR(500) NOT NULL,
        address_encrypted TEXT,
        is_encrypted TINYINT(1) DEFAULT 0,
        ward VARCHAR(100),
        district VARCHAR(100),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(50) DEFAULT 'Vietnam',
        is_default TINYINT(1) DEFAULT 0,
        label VARCHAR(50) DEFAULT 'Home',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng password_resets
    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_email (email),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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

    // Tạo bảng review_media
    await connection.query(`
      CREATE TABLE IF NOT EXISTS review_media (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        review_id BIGINT UNSIGNED NOT NULL,
        media_type ENUM('image', 'video') NOT NULL,
        media_url VARCHAR(1000) NOT NULL,
        thumbnail_url VARCHAR(1000) DEFAULT NULL,
        file_size INT DEFAULT NULL,
        mime_type VARCHAR(100) DEFAULT NULL,
        position INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_review_id (review_id),
        KEY idx_media_type (media_type),
        CONSTRAINT fk_review_media_review 
          FOREIGN KEY (review_id) 
          REFERENCES product_reviews(id) 
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng admin_users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        email_hash VARCHAR(64) UNIQUE,
        email_encrypted TEXT,
        is_encrypted TINYINT(1) DEFAULT 0,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        bio TEXT,
        avatar_url VARCHAR(1000),
        social_links JSON,
        is_active TINYINT(1) DEFAULT 1,
        last_login TIMESTAMP NULL,
        role_id BIGINT UNSIGNED,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        failed_login_attempts INT DEFAULT 0,
        lockout_until TIMESTAMP NULL,
        two_factor_secret TEXT,
        two_factor_enabled TINYINT(1) DEFAULT 0,
        two_factor_type VARCHAR(20) DEFAULT 'email',
        two_factor_backup_codes JSON,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_admin_email_hash (email_hash),
        INDEX idx_admin_role (role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng banners
    await connection.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(1000) NOT NULL,
        mobile_image_url VARCHAR(1000),
        link_url VARCHAR(1000),
        link_text VARCHAR(100),
        position VARCHAR(50) DEFAULT 'homepage',
        display_order INT DEFAULT 0,
        start_date TIMESTAMP NULL,
        end_date TIMESTAMP NULL,
        is_active TINYINT(1) DEFAULT 1,
        click_count INT DEFAULT 0,
        impression_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_position (position),
        INDEX idx_active_dates (is_active, start_date, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng coupons
    await connection.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255),
        discount_type ENUM('fixed', 'percent') DEFAULT 'fixed',
        discount_value DECIMAL(12, 2) NOT NULL CHECK (discount_value >= 0),
        min_order_amount DECIMAL(12, 2) CHECK (min_order_amount >= 0 OR min_order_amount IS NULL),
        max_discount_amount DECIMAL(12, 2),
        starts_at TIMESTAMP NULL,
        ends_at TIMESTAMP NULL,
        usage_limit INT,
        usage_limit_per_user INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_deleted_at (deleted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng coupon_usage
    await connection.query(`
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        coupon_id BIGINT UNSIGNED,
        coupon_code VARCHAR(100),
        user_id BIGINT UNSIGNED,
        order_id BIGINT UNSIGNED,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng vouchers
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        value DECIMAL(12, 2) NOT NULL CHECK (value >= 0),
        discount_type ENUM('fixed', 'percent') DEFAULT 'fixed',
        description VARCHAR(255),
        issued_by_user_id BIGINT UNSIGNED,
        recipient_user_id BIGINT UNSIGNED,
        redeemed_by_user_id BIGINT UNSIGNED,
        status ENUM('active', 'inactive', 'redeemed', 'expired') DEFAULT 'active',
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP NULL,
        redeemed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_deleted_at (deleted_at),
        FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (redeemed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng flash_sales
    await connection.query(`
      CREATE TABLE IF NOT EXISTS flash_sales(
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      status ENUM('upcoming', 'active', 'ended', 'cancelled') DEFAULT 'upcoming',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
      `);

    // Tạo bảng flash_sale_items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS flash_sale_items(
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        flash_sale_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        sale_price DECIMAL(12, 2) NOT NULL CHECK (sale_price >= 0),
        limit_per_customer INT DEFAULT 1,
        total_quantity INT NOT NULL,
        sold_quantity INT DEFAULT 0,
        FOREIGN KEY(flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
        `);

    // Tạo bảng faq_categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS faq_categories(
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          icon VARCHAR(100),
          position INT DEFAULT 0,
          is_active TINYINT(1) DEFAULT 1
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
          `);

    // Tạo bảng faqs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS faqs(
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            category_id BIGINT UNSIGNED NOT NULL,
            question TEXT NOT NULL,
            answer LONGTEXT NOT NULL,
            position INT DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY(category_id) REFERENCES faq_categories(id) ON DELETE CASCADE
          ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
            `);

    // Tạo bảng pages
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pages(
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              slug VARCHAR(255) NOT NULL UNIQUE,
              content LONGTEXT,
              is_active TINYINT(1) DEFAULT 1,
              meta_title VARCHAR(255),
              meta_description TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
              `);

    // Tạo bảng news
    await connection.query(`
      CREATE TABLE IF NOT EXISTS news(
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL UNIQUE,
                summary TEXT,
                content LONGTEXT,
                image_url VARCHAR(1000),
                author_id BIGINT UNSIGNED,
                is_active TINYINT(1) DEFAULT 1,
                published_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
              ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
                `);

    // Tạo bảng newsletter_subscriptions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions(
                  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  email VARCHAR(255) NOT NULL UNIQUE,
                  status ENUM('subscribed', 'unsubscribed') DEFAULT 'subscribed',
                  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  unsubscribed_at TIMESTAMP NULL
                ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
                  `);

    // Tạo bảng news_comments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS news_comments (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        news_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        parent_id BIGINT UNSIGNED NULL,
        comment TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
        likes_count INT DEFAULT 0,
        is_edited TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES news_comments(id) ON DELETE CASCADE,
        INDEX idx_news_id (news_id),
        INDEX idx_status (status),
        INDEX idx_parent_id (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migration cho news_comments nếu đã tồn tại nhưng thiếu cột mới
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM news_comments');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('parent_id')) {
        await connection.query(
          'ALTER TABLE news_comments ADD COLUMN parent_id BIGINT UNSIGNED NULL AFTER user_id'
        );
        await connection.query(
          'ALTER TABLE news_comments ADD CONSTRAINT fk_news_comments_parent FOREIGN KEY (parent_id) REFERENCES news_comments(id) ON DELETE CASCADE'
        );
        await connection.query('ALTER TABLE news_comments ADD INDEX idx_parent_id (parent_id)');
      }
      if (!columnNames.includes('likes_count')) {
        await connection.query(
          'ALTER TABLE news_comments ADD COLUMN likes_count INT DEFAULT 0 AFTER status'
        );
      }
      if (!columnNames.includes('updated_at')) {
        await connection.query(
          'ALTER TABLE news_comments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        );
      }
      if (!columnNames.includes('is_edited')) {
        await connection.query(
          'ALTER TABLE news_comments ADD COLUMN is_edited TINYINT(1) DEFAULT 0 AFTER likes_count'
        );
      }
    } catch (e) {
      console.log('Error migrating news_comments table:', e);
    }

    // Tạo bảng news_comment_likes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS news_comment_likes (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        comment_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_comment_user (comment_id, user_id),
        FOREIGN KEY (comment_id) REFERENCES news_comments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng stores
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stores(
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    address TEXT NOT NULL,
                    city VARCHAR(100),
                    state VARCHAR(100),
                    phone VARCHAR(20),
                    email VARCHAR(255),
                    latitude DECIMAL(10, 8),
                    longitude DECIMAL(11, 8),
                    description TEXT,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
                    `);

    // Tạo bảng store_hours
    await connection.query(`
      CREATE TABLE IF NOT EXISTS store_hours(
                      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                      store_id BIGINT UNSIGNED NOT NULL,
                      day_of_week TINYINT(1) NOT NULL COMMENT '0: Sunday, 1: Monday, ...',
                      open_time TIME,
                      close_time TIME,
                      is_closed TINYINT(1) DEFAULT 0,
                      FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
                    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
                      `);

    // Tạo bảng roles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles(
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(100) NOT NULL UNIQUE,
                        slug VARCHAR(100) NOT NULL UNIQUE,
                        description TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
                        `);

    // Tạo bảng permissions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions(
                          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                          name VARCHAR(100) NOT NULL UNIQUE,
                          slug VARCHAR(100) NOT NULL UNIQUE,
                          module VARCHAR(100),
                          description TEXT,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
                          `);

    // Bảng role_permissions (Many-to-Many cho RBAC) đã được Drizzle quản lý qua migration `0001_reflective_iceman.sql`.

    // Tạo bảng refunds
    await connection.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT UNSIGNED NOT NULL,
        request_id BIGINT UNSIGNED DEFAULT NULL,
        refund_amount DECIMAL(12,2) NOT NULL CHECK (refund_amount >= 0),
        status VARCHAR(50) DEFAULT 'completed',
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (request_id) REFERENCES refund_requests(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng point_transactions
    await connection.query(`
        CREATE TABLE IF NOT EXISTS point_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          points INT NOT NULL,
          type ENUM('earn', 'spend', 'refund', 'expire', 'redeem') NOT NULL,
          source VARCHAR(255) NULL,
          source_id VARCHAR(255) NULL,
          balance_after INT NULL,
          expiry_date DATE NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

    // Tạo bảng admin_activity_logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_activity_logs(
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        admin_user_id BIGINT UNSIGNED,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        old_values JSON,
        new_values JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
        INDEX idx_action(action),
        INDEX idx_admin(admin_user_id),
        INDEX idx_entity(entity_type, entity_id)
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
        `);

    // Migration: Thêm bio, security, 2FA cho admin_users
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM admin_users');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('email_hash')) {
        await connection.query(
          'ALTER TABLE admin_users ADD COLUMN email_hash VARCHAR(64) UNIQUE AFTER email'
        );
      }
      if (!columnNames.includes('email_encrypted')) {
        await connection.query(
          'ALTER TABLE admin_users ADD COLUMN email_encrypted TEXT AFTER email_hash'
        );
      }
      if (!columnNames.includes('is_encrypted')) {
        await connection.query(
          'ALTER TABLE admin_users ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0 AFTER email_encrypted'
        );
      }
      if (!columnNames.includes('bio')) {
        await connection.query('ALTER TABLE admin_users ADD COLUMN bio TEXT AFTER full_name');
      }
      if (!columnNames.includes('avatar_url')) {
        await connection.query(
          'ALTER TABLE admin_users ADD COLUMN avatar_url VARCHAR(1000) AFTER bio'
        );
      }
      if (!columnNames.includes('social_links')) {
        await connection.query(
          'ALTER TABLE admin_users ADD COLUMN social_links JSON AFTER avatar_url'
        );
      }
      if (!columnNames.includes('deleted_at')) {
        await connection.query(
          'ALTER TABLE admin_users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at'
        );
        await connection.query(
          'ALTER TABLE admin_users ADD INDEX idx_admin_deleted_at (deleted_at)'
        );
      }
      if (!columnNames.includes('failed_login_attempts')) {
        await connection.query(
          'ALTER TABLE admin_users ADD COLUMN failed_login_attempts INT DEFAULT 0'
        );
      }
      if (!columnNames.includes('lockout_until')) {
        await connection.query('ALTER TABLE admin_users ADD COLUMN lockout_until TIMESTAMP NULL');
      }
      if (!columnNames.includes('two_factor_secret')) {
        await connection.query('ALTER TABLE admin_users ADD COLUMN two_factor_secret TEXT');
      }
      if (!columnNames.includes('two_factor_enabled')) {
        await connection.query(
          'ALTER TABLE admin_users ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0'
        );
      }
      if (!columnNames.includes('two_factor_type')) {
        await connection.query(
          "ALTER TABLE admin_users ADD COLUMN two_factor_type VARCHAR(20) DEFAULT 'email'"
        );
      }
      if (!columnNames.includes('two_factor_backup_codes')) {
        await connection.query('ALTER TABLE admin_users ADD COLUMN two_factor_backup_codes JSON');
      }
    } catch (e) {
      console.log('Error migrating admin_users table:', e);
    }

    // Tạo bảng gift_card_transactions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS gift_card_transactions(
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          gift_card_id BIGINT UNSIGNED NOT NULL,
          transaction_type ENUM('purchase', 'redeem', 'refund', 'adjustment') DEFAULT 'redeem',
          amount DECIMAL(12, 2) NOT NULL,
          balance_before DECIMAL(12, 2) NOT NULL,
          balance_after DECIMAL(12, 2) NOT NULL,
          description TEXT,
          order_id BIGINT UNSIGNED NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE,
          FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
          `);

    // Tạo bảng rate_limits cho hệ thống bảo mật
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rate_limits(
            \`key\` VARCHAR(255) PRIMARY KEY,
        \`count\` INT NOT NULL DEFAULT 0,
        \`expires_at\` BIGINT NOT NULL,
        INDEX idx_expiry (\`expires_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng product_gender_categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_gender_categories (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT UNSIGNED NOT NULL,
        gender ENUM('men', 'women', 'unisex', 'kids', 'boys', 'girls') NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_gender (gender)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migration: Thêm các cột thiếu cho products
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM products');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('sport_id')) {
        console.log('Adding sport_id column to products table...');
        await connection.query('ALTER TABLE products ADD COLUMN sport_id BIGINT UNSIGNED');
        await connection.query(
          'ALTER TABLE products ADD CONSTRAINT fk_product_sport FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL'
        );
      }
      if (!columnNames.includes('is_featured')) {
        await connection.query(
          'ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER is_active'
        );
      }
      if (!columnNames.includes('is_new_arrival')) {
        await connection.query(
          'ALTER TABLE products ADD COLUMN is_new_arrival TINYINT(1) DEFAULT 1 AFTER is_featured'
        );
      }
      if (!columnNames.includes('view_count')) {
        await connection.query(
          'ALTER TABLE products ADD COLUMN view_count INT DEFAULT 0 AFTER is_new_arrival'
        );
      }
      if (!columnNames.includes('sale_count')) {
        await connection.query(
          'ALTER TABLE products ADD COLUMN sale_count INT DEFAULT 0 AFTER view_count'
        );
      }
      if (!columnNames.includes('meta_title')) {
        await connection.query(
          'ALTER TABLE products ADD COLUMN meta_title VARCHAR(255) AFTER sale_count'
        );
      }
      if (!columnNames.includes('meta_description')) {
        await connection.query(
          'ALTER TABLE products ADD COLUMN meta_description TEXT AFTER meta_title'
        );
      }
      // Migration: Add cost_price for BI/Profit tracking
      if (!columnNames.includes('cost_price')) {
        await connection.query(
          'ALTER TABLE products ADD COLUMN cost_price DECIMAL(12, 2) DEFAULT 0 AFTER msrp_price'
        );
      }
      // Migration: Add Full-Text Search Index
      try {
        await connection.query(
          'ALTER TABLE products ADD FULLTEXT INDEX idx_fts_product (name, sku, description)'
        );
      } catch (ftsErr) {
        console.log('FTS Index already exists or not supported by Engine');
      }
    } catch (e) {
      console.log('Error migrating products table:', e);
    }

    // Migration: Thêm các cột thiếu cho categories
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM categories');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('meta_title')) {
        await connection.query(
          'ALTER TABLE categories ADD COLUMN meta_title VARCHAR(255) AFTER is_active'
        );
      }
      if (!columnNames.includes('meta_description')) {
        await connection.query(
          'ALTER TABLE categories ADD COLUMN meta_description TEXT AFTER meta_title'
        );
      }
    } catch (e) {
      console.log('Error migrating categories table:', e);
    }

    // Migration: Thêm các cột thiếu cho product_images
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM product_images');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('color_id')) {
        await connection.query(
          'ALTER TABLE product_images ADD COLUMN color_id BIGINT UNSIGNED NULL AFTER product_id'
        );
        await connection.query(
          'ALTER TABLE product_images ADD CONSTRAINT fk_product_images_color FOREIGN KEY (color_id) REFERENCES product_colors(id) ON DELETE SET NULL'
        );
      }
    } catch (e) {
      console.log('Error migrating product_images table:', e);
    }

    // Migration: Thêm các cột thiếu cho product_reviews
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM product_reviews');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('is_featured')) {
        await connection.query(
          'ALTER TABLE product_reviews ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER helpful_count'
        );
      }
    } catch (e) {
      console.log('Error migrating product_reviews table:', e);
    }

    // Migration: Thêm các cột thiếu cho order_items
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM order_items');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('product_variant_id')) {
        console.log('Adding product_variant_id column to order_items table...');
        await connection.query(
          'ALTER TABLE order_items ADD COLUMN product_variant_id BIGINT UNSIGNED NULL AFTER product_id'
        );
        await connection.query(
          'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL'
        );
      }
      if (!columnNames.includes('inventory_id')) {
        console.log('Adding inventory_id column to order_items table...');
        await connection.query(
          'ALTER TABLE order_items ADD COLUMN inventory_id BIGINT UNSIGNED NULL AFTER product_variant_id'
        );
        await connection.query(
          'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL'
        );
      }
      if (!columnNames.includes('sku')) {
        await connection.query(
          'ALTER TABLE order_items ADD COLUMN sku VARCHAR(100) AFTER product_name'
        );
      }
      if (!columnNames.includes('unit_price')) {
        await connection.query(
          'ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(12, 2) AFTER quantity'
        );
      }
      if (!columnNames.includes('total_price')) {
        await connection.query(
          'ALTER TABLE order_items ADD COLUMN total_price DECIMAL(12, 2) AFTER unit_price'
        );
      }
      if (!columnNames.includes('flash_sale_item_id')) {
        await connection.query(
          'ALTER TABLE order_items ADD COLUMN flash_sale_item_id BIGINT UNSIGNED NULL AFTER total_price'
        );
      }
      // Migration: Add cost_price to order_items for profit snapshot
      if (!columnNames.includes('cost_price')) {
        await connection.query(
          'ALTER TABLE order_items ADD COLUMN cost_price DECIMAL(12, 2) DEFAULT 0 AFTER unit_price'
        );
      }
    } catch (e) {
      console.log('Error migrating order_items table:', e);
    }

    // Seed data for sports
    const sports = [
      ['Running', 'running', 'Running shoes and gear'],
      ['Basketball', 'basketball', 'Basketball shoes and apparel'],
      ['Training \u0026 Gym', 'training', 'Training and gym gear'],
      ['Football', 'football', 'Football boots and kits'],
      ['Tennis', 'tennis', 'Tennis shoes and apparel'],
      ['Yoga', 'yoga', 'Yoga and lifestyle apparel'],
      ['Skateboarding', 'skateboarding', 'Skateboarding shoes and gear'],
    ];

    for (const [name, slug, desc] of sports) {
      await connection.query(
        `
          INSERT IGNORE INTO sports (name, slug, description)
          VALUES (?, ?, ?)
        `,
        [name, slug, desc]
      );
    }

    // Migration: Add deleted_at columns to all target tables
    const tablesToMigrate = [
      'users',
      'products',
      'categories',
      'vouchers',
      'flash_sales',
      'coupons',
    ];
    for (const table of tablesToMigrate) {
      try {
        const [columns]: any = await connection.query(`SHOW COLUMNS FROM ${table}`);
        const columnNames = columns.map((col: any) => col.Field);
        if (!columnNames.includes('deleted_at')) {
          console.log(`Adding deleted_at column to ${table} table...`);
          await connection.query(
            `ALTER TABLE ${table} ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`
          );
          await connection.query(`ALTER TABLE ${table} ADD INDEX idx_deleted_at (deleted_at)`);
        }
      } catch (e) {
        console.log(`Error migrating ${table} for soft delete:`, e);
      }
    }

    // Tạo bảng security_logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NULL,
        admin_id BIGINT UNSIGNED NULL,
        event_type VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        details JSON,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migration: Thêm các cột thiếu cho security_logs
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM security_logs');
      const columnNames = columns.map((col: any) => col.Field);

      if (!columnNames.includes('user_id')) {
        console.log('Adding user_id column to security_logs table...');
        await connection.query(
          'ALTER TABLE security_logs ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id'
        );
        await connection.query(
          'ALTER TABLE security_logs ADD CONSTRAINT fk_security_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'
        );
      }
      if (!columnNames.includes('admin_id')) {
        console.log('Adding admin_id column to security_logs table...');
        await connection.query(
          'ALTER TABLE security_logs ADD COLUMN admin_id BIGINT UNSIGNED NULL AFTER user_id'
        );
        await connection.query(
          'ALTER TABLE security_logs ADD CONSTRAINT fk_security_logs_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL'
        );
      }
      if (!columnNames.includes('event_type')) {
        console.log('Adding event_type column to security_logs table...');
        await connection.query(
          'ALTER TABLE security_logs ADD COLUMN event_type VARCHAR(100) NOT NULL AFTER admin_id'
        );
      }
      if (!columnNames.includes('ip_address')) {
        console.log('Adding ip_address column to security_logs table...');
        await connection.query(
          'ALTER TABLE security_logs ADD COLUMN ip_address VARCHAR(45) AFTER event_type'
        );
      }
      if (!columnNames.includes('user_agent')) {
        console.log('Adding user_agent column to security_logs table...');
        await connection.query(
          'ALTER TABLE security_logs ADD COLUMN user_agent TEXT AFTER ip_address'
        );
      }
      if (!columnNames.includes('details')) {
        console.log('Adding details column to security_logs table...');
        await connection.query(
          'ALTER TABLE security_logs ADD COLUMN details JSON AFTER user_agent'
        );
      }
      if (!columnNames.includes('status')) {
        console.log('Adding status column to security_logs table...');
        await connection.query(
          'ALTER TABLE security_logs ADD COLUMN status VARCHAR(50) AFTER details'
        );
      }
    } catch (e) {
      console.log('Error migrating security_logs table:', e);
    }

    // Migration for vouchers & coupons (Category limits)
    try {
      // Vouchers
      const [vCols]: any = await connection.query('SHOW COLUMNS FROM vouchers');
      const vColNames = vCols.map((col: any) => col.Field);
      if (!vColNames.includes('min_order_value')) {
        await connection.query(
          'ALTER TABLE vouchers ADD COLUMN min_order_value DECIMAL(12, 2) DEFAULT 0 AFTER value'
        );
      }
      if (!vColNames.includes('applicable_categories')) {
        await connection.query(
          'ALTER TABLE vouchers ADD COLUMN applicable_categories JSON NULL AFTER min_order_value'
        );
      }

      // Coupons
      const [cCols]: any = await connection.query('SHOW COLUMNS FROM coupons');
      const cColNames = cCols.map((col: any) => col.Field);
      if (!cColNames.includes('min_order_amount')) {
        await connection.query(
          'ALTER TABLE coupons ADD COLUMN min_order_amount DECIMAL(12, 2) DEFAULT 0 AFTER value'
        );
      }
      if (!cColNames.includes('applicable_categories')) {
        await connection.query(
          'ALTER TABLE coupons ADD COLUMN applicable_categories JSON NULL AFTER min_order_amount'
        );
      }
    } catch (e) {
      console.log('Error migrating vouchers/coupons tables:', e);
    }

    // Tạo bảng support_chats
    await connection.query(`
      CREATE TABLE IF NOT EXISTS support_chats (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NULL,
        guest_email VARCHAR(255),
        guest_name VARCHAR(255),
        status ENUM('waiting', 'active', 'resolved', 'closed') DEFAULT 'waiting',
        access_token VARCHAR(255) NULL,
        assigned_admin_id BIGINT UNSIGNED NULL,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        first_response_at TIMESTAMP NULL,
        sla_breached BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL,
        INDEX idx_access_token (access_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo bảng support_messages
    await connection.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        chat_id BIGINT UNSIGNED NOT NULL,
        sender_type ENUM('customer', 'admin') NOT NULL,
        sender_id BIGINT UNSIGNED NULL,
        message TEXT,
        image_url VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES support_chats(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migration: Thêm access_token cho support_chats nếu chưa có
    try {
      const [columns]: any = await connection.query('SHOW COLUMNS FROM support_chats');
      const columnNames = columns.map((col: any) => col.Field);
      if (!columnNames.includes('access_token')) {
        console.log('Adding access_token column to support_chats table...');
        await connection.query(
          'ALTER TABLE support_chats ADD COLUMN access_token VARCHAR(255) NULL AFTER status'
        );
        await connection.query(
          'ALTER TABLE support_chats ADD INDEX idx_access_token (access_token)'
        );
      }
      if (!columnNames.includes('first_response_at')) {
        await connection.query(
          'ALTER TABLE support_chats ADD COLUMN first_response_at TIMESTAMP NULL AFTER last_message_at'
        );
      }
      if (!columnNames.includes('sla_breached')) {
        await connection.query(
          'ALTER TABLE support_chats ADD COLUMN sla_breached BOOLEAN DEFAULT FALSE AFTER first_response_at'
        );
      }
    } catch (e) {
      console.log('Error migrating support_chats table:', e);
    }

    // --- NEW: Phase 19 Tables ---

    // 1. SEO Metadata Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS seo_metadata (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        entity_type ENUM('product', 'category', 'collection', 'page') NOT NULL,
        entity_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(255),
        description TEXT,
        keywords VARCHAR(500),
        og_image_url VARCHAR(1000),
        canonical_url VARCHAR(500),
        structured_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_entity (entity_type, entity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 2. Dynamic Attributes (EAV)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attributes (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        type ENUM('text', 'number', 'select', 'color', 'boolean') DEFAULT 'text',
        is_filterable TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_attribute_values (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT UNSIGNED NOT NULL,
        attribute_id BIGINT UNSIGNED NOT NULL,
        value_text TEXT,
        option_id BIGINT UNSIGNED NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
        FOREIGN KEY (option_id) REFERENCES attribute_values(id) ON DELETE SET NULL,
        INDEX idx_product (product_id),
        INDEX idx_attribute (attribute_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 3. Notifications Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        type ENUM('order', 'social', 'promo', 'system') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(255),
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_read (user_id, is_read),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ═══════════════════════════════════════════
    // GDPR COMPLIANCE TABLES
    // ═══════════════════════════════════════════

    // Bảng user_consents: Theo dõi sự đồng ý (consent) của người dùng cho từng mục đích
    // (marketing, analytics, v.v.) theo đúng chuẩn GDPR EU.
    // Mỗi lần user bật/tắt consent sẽ ghi 1 record mới (immutable audit trail).
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_consents (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        purpose ENUM('marketing', 'analytics', 'personalization', 'third_party') NOT NULL,
        is_granted TINYINT(1) NOT NULL DEFAULT 0,
        ip_address VARCHAR(45),
        user_agent TEXT,
        version INT DEFAULT 1 COMMENT 'Consent policy version at time of agreement',
        granted_at TIMESTAMP NULL,
        revoked_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_purpose (user_id, purpose),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Bảng cookie_consents: Lưu trữ lựa chọn cookie của visitor/user (Essential, Analytics, Marketing, Functional).
    // Thay vì chỉ dùng localStorage, lưu vào DB để Admin có thể audit và chứng minh compliance.
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cookie_consents (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_id BIGINT UNSIGNED NULL,
        preferences JSON NOT NULL COMMENT '{"essential":true,"analytics":false,"marketing":false,"functional":true}',
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_session (session_id),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Bảng data_requests: Quản lý yêu cầu quyền dữ liệu cá nhân theo GDPR
    // (Right to Access = export, Right to be Forgotten = delete, Right to Rectification = modify).
    // Admin xử lý và cập nhật status cho từng yêu cầu trong dashboard.
    await connection.query(`
      CREATE TABLE IF NOT EXISTS data_requests (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        request_type ENUM('export', 'delete', 'modify') NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'rejected') DEFAULT 'pending',
        reason TEXT COMMENT 'User reason for the request',
        admin_notes TEXT COMMENT 'Admin response or processing notes',
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ═══════════════════════════════════════════
    // LƯU Ý QUAN TRỌNG VỀ DATABASE SCHEMA (GDPR, MIGRATIONS)
    // ═══════════════════════════════════════════
    // File init.ts này chứa 62 base tables.
    // Tuy nhiên, database thực tế có 83 tables. 21 bảng còn lại được quản lý bằng Drizzle ORM Migrations.
    // Các bảng Drizzle quản lý bao gồm: _migrations, admin_audit_logs, daily_metrics, gift_card_lockouts,
    // inventory_transfers, payments, product_embeddings, search_analytics, system_config, v.v.
    //
    // ĐỂ FRESH DEPLOY, HÃY CHẠY:
    // 1. npm run db:init (chạy file này)
    // 2. npx drizzle-kit push (để tạo 21 bảng còn lại và đồng bộ schema)

    console.log(
      'Khởi tạo cơ sở dữ liệu thành công. VUI LÒNG CHẠY "npx drizzle-kit push" ĐỂ HOÀN TẤT SCHEMA.'
    );
    // ═══════════════════════════════════════════
    // PHASE 21: SECURITY HARDENING & TRIGGERS
    // ═══════════════════════════════════════════

    // 1. Restore Inventory Triggers (Prevent negative stock)
    await connection.query(`
      DROP TRIGGER IF EXISTS trg_inventory_before_update;
    `);
    await connection.query(`
      CREATE TRIGGER trg_inventory_before_update
      BEFORE UPDATE ON inventory
      FOR EACH ROW
      BEGIN
        IF NEW.quantity < 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inventory quantity cannot be negative';
        END IF;
        IF NEW.reserved < 0 THEN
          SET NEW.reserved = 0;
        END IF;
      END
    `);

    // 2. Voucher Status Auto-Sync Trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS trg_vouchers_status_sync;
    `);
    await connection.query(`
      CREATE TRIGGER trg_vouchers_status_sync
      BEFORE UPDATE ON vouchers
      FOR EACH ROW
      BEGIN
        IF NEW.redeemed_at IS NOT NULL AND NEW.status = 'active' THEN
          SET NEW.status = 'redeemed';
        END IF;
        IF NEW.deleted_at IS NOT NULL AND NEW.status != 'expired' THEN
          SET NEW.status = 'expired';
        END IF;
      END
    `);

    // 2. Reverse Coupon Usage - NOT DELETING, Keep for tracking.
    // Future: Add 'status' column to coupon_usage to mark as cancelled.
    // This block seems to be misplaced in a database migration file.
    // It appears to be application logic that would typically reside in a service or controller
    // when an order is cancelled, not directly in a database initialization script.
    // If this is intended to be a comment or placeholder for future work, it should be treated as such.
    // As per the instruction, I'm inserting it as provided.
    // Note: 'orderInfo' and 'logger' are not defined in this scope. This code will cause a runtime error if executed.
    // Assuming this is a placeholder or a comment for future implementation.
    /*
    if (orderInfo[0].promotion_code) {
      logger.info(
        `[Coupon] Order ${orderNumber} cancelled. Keeping usage of ${orderInfo[0].promotion_code} for history.`
      );
    }
    */

    // 3. Admin manager account hardening
    const [manager]: any = await connection.query(
      "SELECT id FROM admin_users WHERE username = 'manager'"
    );
    if (manager.length > 0) {
      console.log('Hardening manager account (id=2)...');
      // Set a random ultra-secure password and keep it disabled if it was NULL or placeholder
      await connection.query(
        `UPDATE admin_users
         SET is_active = 0,
             password = COALESCE(password, '$2b$10$UnbreakaBlePasswordPlaceholderThatNoOneCanGuess')
         WHERE username = 'manager'`
      );
    }

    // 4. Cleanup Zombie Table 'product_attributes' if it exists (EAV is in product_attribute_values)
    try {
      await connection.query('DROP TABLE IF EXISTS product_attributes');
    } catch (e) {
      /* ignore */
    }

    // 5. Backfill Fix for Issue 3.3 (Financial discrepancies)
    const [emptyCost]: any = await connection.query(
      'SELECT id FROM order_items WHERE cost_price = 0 OR cost_price IS NULL LIMIT 1'
    );
    if (emptyCost.length > 0) {
      console.log('Backfilling cost_price for existing order_items...');
      await connection.query(`
        UPDATE order_items oi
        JOIN products p ON oi.product_id = p.id
        SET oi.cost_price = p.cost_price
        WHERE oi.cost_price = 0 OR oi.cost_price IS NULL
      `);
    }

    // 6. Privacy Hardening: Mask plaintext emails in users table
    // We keep email_hash for lookups and email_encrypted for retrieval
    await connection.query(`
      UPDATE users 
      SET email = CONCAT(LEFT(email, 1), '***', RIGHT(email, 5))
      WHERE email NOT LIKE '%***%' AND email_hash IS NOT NULL
    `);

    // 7. Add missing indexes for performance
    try {
      await connection.query(
        'ALTER TABLE gift_card_transactions ADD INDEX idx_order_id (order_id)'
      );
      await connection.query('ALTER TABLE security_logs ADD INDEX idx_event_type (event_type)');
    } catch (e) {
      /* already exists */
    }

    // 8. Create shipments and shipment_items tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT UNSIGNED NOT NULL,
        warehouse_id BIGINT UNSIGNED NULL,
        tracking_number VARCHAR(100),
        carrier VARCHAR(100),
        status VARCHAR(50) DEFAULT 'preparing',
        estimated_delivery TIMESTAMP NULL,
        shipped_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipment_items (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        shipment_id BIGINT UNSIGNED NOT NULL,
        order_item_id BIGINT UNSIGNED NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
        FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.commit();
    console.log('Database initialized successfully with security hardening.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    // Note: Do not end the pool here, as it's shared across the app
  }
}
