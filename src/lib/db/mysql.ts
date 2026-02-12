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
    timezone: 'local'
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

        // Migration: Thêm các cột cần thiết cho users nếu chưa có (không dùng IF NOT EXISTS vì version MySQL cũ không hỗ trợ)
        try {
            const [columns]: any = await connection.query('SHOW COLUMNS FROM users');
            const columnNames = columns.map((col: any) => col.Field);

            if (!columnNames.includes('accumulated_points')) {
                await connection.query('ALTER TABLE users ADD COLUMN accumulated_points INT DEFAULT 0');
            }
            if (!columnNames.includes('membership_tier')) {
                await connection.query("ALTER TABLE users ADD COLUMN membership_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze'");
            }
            if (!columnNames.includes('is_banned')) {
                await connection.query("ALTER TABLE users ADD COLUMN is_banned TINYINT(1) DEFAULT 0 COMMENT 'User banned status: 0 = active, 1 = banned'");
            }
        } catch (e) {
            console.log('Error adding columns to users:', e);
        }

        // Tạo bảng settings phục vụ trang admin/settings
        await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

        // Tạo bảng attribute_values
        await connection.query(`
      CREATE TABLE IF NOT EXISTS attribute_values (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        attribute_id BIGINT UNSIGNED NOT NULL,
        value VARCHAR(255) NOT NULL,
        position INT DEFAULT 0,
        FOREIGN KEY (attribute_id) REFERENCES category_attributes(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

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
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
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
        base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
        retail_price DECIMAL(12,2) DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        is_featured TINYINT(1) DEFAULT 0,
        is_new_arrival TINYINT(1) DEFAULT 1,
        view_count INT DEFAULT 0,
        sale_count INT DEFAULT 0,
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_active (is_active),
        INDEX idx_is_featured (is_featured),
        INDEX idx_is_new_arrival (is_new_arrival),
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
        color VARCHAR(100),
        barcode VARCHAR(100),
        attributes JSON,
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        weight DECIMAL(10,3) DEFAULT 0,
        height DECIMAL(10,3) DEFAULT 0,
        width DECIMAL(10,3) DEFAULT 0,
        depth DECIMAL(10,3) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
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
        quantity INT NOT NULL DEFAULT 0,
        reserved INT NOT NULL DEFAULT 0,
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
        quantity_change INT NOT NULL,
        reason VARCHAR(255),
        reference_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
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
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(12, 2) NOT NULL,
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
        status ENUM('pending', 'pending_payment_confirmation', 'payment_received', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        currency VARCHAR(10) DEFAULT 'VND',
        total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        shipping_fee DECIMAL(12, 2) DEFAULT 0.00,
        discount DECIMAL(12, 2) DEFAULT 0.00,
        voucher_code VARCHAR(100),
        voucher_discount DECIMAL(12, 2) DEFAULT 0.00,
        giftcard_number VARCHAR(16),
        giftcard_discount DECIMAL(12, 2) DEFAULT 0.00,
        tax DECIMAL(12, 2) DEFAULT 0.00,
        subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        shipping_address TEXT,
        shipping_address_id BIGINT UNSIGNED NULL,
        shipping_address_snapshot JSON,
        billing_address TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        payment_method VARCHAR(50) DEFAULT 'cod',
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        tracking_number VARCHAR(100),
        carrier VARCHAR(100),
        shipped_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        payment_confirmed_at TIMESTAMP NULL,
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
        product_variant_id BIGINT UNSIGNED NULL,
        product_name VARCHAR(500) NOT NULL,
        product_image VARCHAR(1000),
        size VARCHAR(10) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        total DECIMAL(12, 2) NOT NULL,
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
                await connection.query("ALTER TABLE orders ADD COLUMN currency VARCHAR(10) DEFAULT 'VND' AFTER status");
            }
            if (!columnNames.includes('voucher_code')) {
                await connection.query('ALTER TABLE orders ADD COLUMN voucher_code VARCHAR(100) AFTER discount');
            }
            if (!columnNames.includes('voucher_discount')) {
                await connection.query('ALTER TABLE orders ADD COLUMN voucher_discount DECIMAL(12, 2) DEFAULT 0 AFTER voucher_code');
            }
            if (!columnNames.includes('giftcard_number')) {
                await connection.query('ALTER TABLE orders ADD COLUMN giftcard_number VARCHAR(16) AFTER voucher_discount');
            }
            if (!columnNames.includes('giftcard_discount')) {
                await connection.query('ALTER TABLE orders ADD COLUMN giftcard_discount DECIMAL(12, 2) DEFAULT 0 AFTER giftcard_number');
            }
            if (!columnNames.includes('shipping_address_id')) {
                await connection.query('ALTER TABLE orders ADD COLUMN shipping_address_id BIGINT UNSIGNED NULL AFTER shipping_address');
            }
            if (!columnNames.includes('shipping_address_snapshot')) {
                await connection.query('ALTER TABLE orders ADD COLUMN shipping_address_snapshot JSON AFTER shipping_address_id');
            } else {
                // Đảm bảo type là JSON nếu đã có nhưng đang là TEXT
                const snapCol = columns.find((c: any) => c.Field === 'shipping_address_snapshot');
                if (snapCol && snapCol.Type.toLowerCase().includes('text')) {
                    await connection.query('ALTER TABLE orders MODIFY COLUMN shipping_address_snapshot JSON');
                }
            }
            if (!columnNames.includes('tracking_number')) {
                await connection.query('ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) AFTER payment_status');
            }
            if (!columnNames.includes('carrier')) {
                await connection.query('ALTER TABLE orders ADD COLUMN carrier VARCHAR(100) AFTER tracking_number');
            }
            if (!columnNames.includes('shipped_at')) {
                await connection.query('ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP NULL AFTER carrier');
            }
            if (!columnNames.includes('delivered_at')) {
                await connection.query('ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP NULL AFTER shipped_at');
            }
            if (!columnNames.includes('payment_confirmed_at')) {
                await connection.query('ALTER TABLE orders ADD COLUMN payment_confirmed_at TIMESTAMP NULL AFTER delivered_at');
            }

            // Migration cho status ENUM nếu thiếu các giá trị mới
            const statusCol = columns.find((c: any) => c.Field === 'status');
            if (statusCol && !statusCol.Type.includes('pending_payment_confirmation')) {
                await connection.query("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'pending_payment_confirmation', 'payment_received', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'");
            }

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

        // Tạo bảng user_addresses
        await connection.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address_line VARCHAR(500) NOT NULL,
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
        discount_value DECIMAL(12, 2) NOT NULL,
        min_order_amount DECIMAL(12, 2),
        max_discount_amount DECIMAL(12, 2),
        starts_at TIMESTAMP NULL,
        ends_at TIMESTAMP NULL,
        usage_limit INT,
        usage_limit_per_user INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        value DECIMAL(12, 2) NOT NULL,
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
        FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (redeemed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng flash_sales
        await connection.query(`
      CREATE TABLE IF NOT EXISTS flash_sales (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status ENUM('upcoming', 'active', 'ended', 'cancelled') DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng flash_sale_items
        await connection.query(`
      CREATE TABLE IF NOT EXISTS flash_sale_items (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        flash_sale_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        sale_price DECIMAL(12, 2) NOT NULL,
        limit_per_customer INT DEFAULT 1,
        total_quantity INT NOT NULL,
        sold_quantity INT DEFAULT 0,
        FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng faq_categories
        await connection.query(`
      CREATE TABLE IF NOT EXISTS faq_categories (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        icon VARCHAR(100),
        position INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng faqs
        await connection.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        category_id BIGINT UNSIGNED NOT NULL,
        question TEXT NOT NULL,
        answer LONGTEXT NOT NULL,
        position INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng pages
        await connection.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content LONGTEXT,
        is_active TINYINT(1) DEFAULT 1,
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng news
        await connection.query(`
      CREATE TABLE IF NOT EXISTS news (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng newsletter_subscriptions
        await connection.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        status ENUM('subscribed', 'unsubscribed') DEFAULT 'subscribed',
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng stores
        await connection.query(`
      CREATE TABLE IF NOT EXISTS stores (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng store_hours
        await connection.query(`
      CREATE TABLE IF NOT EXISTS store_hours (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        store_id BIGINT UNSIGNED NOT NULL,
        day_of_week TINYINT(1) NOT NULL COMMENT '0: Sunday, 1: Monday, ...',
        open_time TIME,
        close_time TIME,
        is_closed TINYINT(1) DEFAULT 0,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng roles
        await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng permissions
        await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        module VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng role_permission
        await connection.query(`
      CREATE TABLE IF NOT EXISTS role_permission (
        role_id BIGINT UNSIGNED NOT NULL,
        permission_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng admin_activity_logs
        await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_activity_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        admin_id BIGINT UNSIGNED,
        action VARCHAR(100) NOT NULL,
        module VARCHAR(100),
        reference_id VARCHAR(100),
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        // Tạo bảng gift_card_transactions
        await connection.query(`
      CREATE TABLE IF NOT EXISTS gift_card_transactions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        gift_card_id BIGINT UNSIGNED NOT NULL,
        transaction_type ENUM('purchase', 'redeem', 'refund', 'adjustment') DEFAULT 'redeem',
        amount DECIMAL(12,2) NOT NULL,
        balance_before DECIMAL(12,2) NOT NULL,
        balance_after DECIMAL(12,2) NOT NULL,
        description TEXT,
        order_id BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
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
                await connection.query('ALTER TABLE products ADD CONSTRAINT fk_product_sport FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL');
            }
            if (!columnNames.includes('is_featured')) {
                await connection.query('ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER is_active');
            }
            if (!columnNames.includes('is_new_arrival')) {
                await connection.query('ALTER TABLE products ADD COLUMN is_new_arrival TINYINT(1) DEFAULT 1 AFTER is_featured');
            }
            if (!columnNames.includes('view_count')) {
                await connection.query('ALTER TABLE products ADD COLUMN view_count INT DEFAULT 0 AFTER is_new_arrival');
            }
            if (!columnNames.includes('sale_count')) {
                await connection.query('ALTER TABLE products ADD COLUMN sale_count INT DEFAULT 0 AFTER view_count');
            }
            if (!columnNames.includes('meta_title')) {
                await connection.query('ALTER TABLE products ADD COLUMN meta_title VARCHAR(255) AFTER sale_count');
            }
            if (!columnNames.includes('meta_description')) {
                await connection.query('ALTER TABLE products ADD COLUMN meta_description TEXT AFTER meta_title');
            }
        } catch (e) {
            console.log('Error migrating products table:', e);
        }

        // Migration: Thêm các cột thiếu cho categories
        try {
            const [columns]: any = await connection.query('SHOW COLUMNS FROM categories');
            const columnNames = columns.map((col: any) => col.Field);

            if (!columnNames.includes('meta_title')) {
                await connection.query('ALTER TABLE categories ADD COLUMN meta_title VARCHAR(255) AFTER is_active');
            }
            if (!columnNames.includes('meta_description')) {
                await connection.query('ALTER TABLE categories ADD COLUMN meta_description TEXT AFTER meta_title');
            }
        } catch (e) {
            console.log('Error migrating categories table:', e);
        }

        // Migration: Thêm các cột thiếu cho product_images
        try {
            const [columns]: any = await connection.query('SHOW COLUMNS FROM product_images');
            const columnNames = columns.map((col: any) => col.Field);

            if (!columnNames.includes('color_id')) {
                await connection.query('ALTER TABLE product_images ADD COLUMN color_id BIGINT UNSIGNED NULL AFTER product_id');
                await connection.query('ALTER TABLE product_images ADD CONSTRAINT fk_product_images_color FOREIGN KEY (color_id) REFERENCES product_colors(id) ON DELETE SET NULL');
            }
        } catch (e) {
            console.log('Error migrating product_images table:', e);
        }

        // Migration: Thêm các cột thiếu cho product_reviews
        try {
            const [columns]: any = await connection.query('SHOW COLUMNS FROM product_reviews');
            const columnNames = columns.map((col: any) => col.Field);

            if (!columnNames.includes('is_featured')) {
                await connection.query('ALTER TABLE product_reviews ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER helpful_count');
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
                await connection.query('ALTER TABLE order_items ADD COLUMN product_variant_id BIGINT UNSIGNED NULL AFTER product_id');
                await connection.query('ALTER TABLE order_items ADD CONSTRAINT fk_order_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL');
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
            ['Skateboarding', 'skateboarding', 'Skateboarding shoes and gear']
        ];

        for (const [name, slug, desc] of sports) {
            await connection.query(`
          INSERT IGNORE INTO sports (name, slug, description)
          VALUES (?, ?, ?)
        `, [name, slug, desc]);
        }

        console.log('Khởi tạo cơ sở dữ liệu thành công');
        connection.release();
        return true;
    } catch (error) {
        console.error('Lỗi khởi tạo cơ sở dữ liệu:', error);
        return false;
    }
}

// Hàm thực thi truy vấn
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

// Chatbot Search Function
async function searchProductsForChat(keyword: string) {
    try {
        // Search products by name (limit 5)
        const products = await executeQuery<any[]>(
            `SELECT p.id, p.name, p.base_price, p.retail_price, p.slug, p.short_description,
               (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        WHERE p.name LIKE ? AND p.is_active = 1 
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

async function getNewArrivalsForChat() {
    try {
        const products = await executeQuery<any[]>(
            `SELECT p.id, p.name, p.base_price, p.retail_price, p.slug,
               (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        WHERE p.is_active = 1 
        ORDER BY p.created_at DESC 
        LIMIT 5`
        );
        return formatProductsForChat(products);
    } catch (error) {
        console.error('Chatbot New Arrivals Error:', error);
        return [];
    }
}

async function getDiscountedProductsForChat() {
    try {
        const products = await executeQuery<any[]>(
            `SELECT id, name, base_price, retail_price, slug,
               (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        WHERE p.is_active = 1 AND p.retail_price < p.base_price 
        ORDER BY (p.base_price - p.retail_price) DESC 
        LIMIT 5`
        );
        return formatProductsForChat(products);
    } catch (error) {
        console.error('Chatbot Discount Error:', error);
        return [];
    }
}

async function getProductsByCategoryForChat(categorySlug: string) {
    try {
        const products = await executeQuery<any[]>(
            `SELECT p.id, p.name, p.base_price, p.retail_price, p.slug,
               (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND (c.slug = ? OR c.name LIKE ?)
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
async function formatProductsForChat(products: any[]) {
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
        const price = p.base_price;
        const originalPrice = p.retail_price;

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

export async function searchOrderForChat(orderNumber: string) {
    try {
        const orders = await executeQuery<any[]>(
            `SELECT o.order_number, o.status, o.total, o.payment_status, o.created_at,
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o
       WHERE o.order_number = ?
       LIMIT 1`,
            [orderNumber]
        );

        if (!orders || orders.length === 0) return null;
        return orders[0];
    } catch (error) {
        console.error('Chatbot Order Search Error:', error);
        return null;
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
      (p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as is_new_arrival,
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
    SELECT pv.size, i.quantity as stock, i.reserved, pv.price as price_adjustment
    FROM product_variants pv
    LEFT JOIN inventory i ON i.product_variant_id = pv.id
    WHERE pv.product_id = ?
    ORDER BY CAST(pv.size AS DECIMAL(10,1))`,
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
    const bcrypt = await import('bcrypt');
    const cards = await executeQuery<any[]>(
        `SELECT pin, current_balance, status, expires_at FROM gift_cards 
      WHERE card_number = ? AND status = 'active'`,
        [cardNumber]
    );

    if (!cards || cards.length === 0) {
        return null;
    }

    const card = cards[0];
    const pinMatch = await bcrypt.compare(pin, card.pin);

    if (!pinMatch) {
        return null;
    }

    return card;
}

// Address functions
export async function getAddresses(userId: number) {
    return executeQuery<any[]>(
        `SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
        [userId]
    );
}

export async function addAddress(userId: number, data: any) {
    // If set as default, unset other defaults
    if (data.is_default) {
        await executeQuery(
            `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
            [userId]
        );
    }

    const result: any = await executeQuery(
        `INSERT INTO user_addresses (
      user_id, recipient_name, phone, address_line, ward, district, city, state, is_default, label
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            data.recipient_name || data.name || data.fullName, // Handle various potential field names
            data.phone,
            data.address_line || data.address,
            data.ward || '',
            data.district || '',
            data.city,
            data.state || data.city, // Fallback if state not provided
            data.is_default ? 1 : 0,
            data.label || 'Home'
        ]
    );

    return result.insertId;
}

export async function updateAddress(userId: number, addressId: number, data: any) {
    // If set as default, unset other defaults
    if (data.is_default) {
        await executeQuery(
            `UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND id != ?`,
            [userId, addressId]
        );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.recipient_name || data.name || data.fullName) {
        updates.push('recipient_name = ?');
        values.push(data.recipient_name || data.name || data.fullName);
    }
    if (data.phone) {
        updates.push('phone = ?');
        values.push(data.phone);
    }
    if (data.address_line || data.address) {
        updates.push('address_line = ?');
        values.push(data.address_line || data.address);
    }
    if (data.ward !== undefined) {
        updates.push('ward = ?');
        values.push(data.ward);
    }
    if (data.district !== undefined) {
        updates.push('district = ?');
        values.push(data.district);
    }
    if (data.city) {
        updates.push('city = ?');
        values.push(data.city);
    }
    if (data.state) {
        updates.push('state = ?');
        values.push(data.state);
    }
    if (data.is_default !== undefined) {
        updates.push('is_default = ?');
        values.push(data.is_default ? 1 : 0);
    }
    if (data.label) {
        updates.push('label = ?');
        values.push(data.label);
    }

    if (updates.length === 0) return 0;

    values.push(addressId);
    values.push(userId);

    const result: any = await executeQuery(
        `UPDATE user_addresses SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values
    );

    return result.affectedRows;
}

export async function deleteAddress(userId: number, addressId: number) {
    const result: any = await executeQuery(
        `DELETE FROM user_addresses WHERE id = ? AND user_id = ?`,
        [addressId, userId]
    );

    return result.affectedRows;
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
    paymentStatus?: string;
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

        // Tạo hoặc tìm shipping address
        const addressLine = `${shippingAddr.address}, ${shippingAddr.ward}, ${shippingAddr.district}`;

        let shippingAddressId: number | null = null;
        if (orderData.userId) {
            // Check if address exists for logged-in user to link it
            const [existingAddresses]: any = await connection.execute(
                `SELECT id FROM user_addresses 
         WHERE user_id = ? AND recipient_name = ? AND phone = ? AND address_line = ? AND city = ?
         LIMIT 1`,
                [orderData.userId, shippingAddr.name, shippingAddr.phone, addressLine, shippingAddr.city || '']
            );

            if (existingAddresses.length > 0) {
                shippingAddressId = existingAddresses[0].id;
            }
            // IF not found, we DO NOT create a new address. We just leave shippingAddressId as null
            // and rely on shipping_address_snapshot.
        }

        // Tạo order
        const [orderResult]: any = await connection.execute(
            `INSERT INTO orders (user_id, order_number, subtotal, shipping_fee, discount, voucher_code, voucher_discount, giftcard_number, giftcard_discount, tax, total, shipping_address_id, shipping_address_snapshot, status, payment_method, payment_status, placed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW())`,
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
                shippingAddressId,
                JSON.stringify(shippingAddr), // Save snapshot
                orderData.paymentMethod || 'cod',
                orderData.paymentStatus || 'pending'
            ]
        );

        const orderId = orderResult.insertId;

        // Tạo order items
        let verifiedSubtotal = 0;
        for (const item of orderData.items) {
            // Get base product price
            const [productInfo]: any = await connection.execute(
                `SELECT base_price, retail_price FROM products WHERE id = ?`,
                [item.productId]
            );

            if (productInfo.length === 0) {
                throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại.`);
            }

            let actualUnitPrice = parseFloat(productInfo[0].retail_price || productInfo[0].base_price);

            // Check for active Flash Sale for this product
            const [flashSaleItems]: any = await connection.execute(
                `SELECT fsi.id, fsi.flash_price, fsi.quantity_limit, fsi.quantity_sold, fsi.per_user_limit, fs.id as sale_id
                 FROM flash_sale_items fsi
                 JOIN flash_sales fs ON fsi.flash_sale_id = fs.id
                 WHERE fsi.product_id = ? 
                   AND fs.is_active = 1 
                   AND fs.start_time <= NOW() 
                   AND fs.end_time > NOW()
                 LIMIT 1`,
                [item.productId]
            );

            let flashSaleItemId = null;
            if (flashSaleItems.length > 0) {
                const fs = flashSaleItems[0];
                flashSaleItemId = fs.id;

                // Override with Flash Price
                actualUnitPrice = parseFloat(fs.flash_price);

                // 2. Kiểm tra giới hạn số lượng (Quantity Limit)
                if (fs.quantity_limit !== null && (fs.quantity_sold + item.quantity > fs.quantity_limit)) {
                    throw new Error(`Sản phẩm ${item.productName} đã hết lượt giảm giá Flash Sale.`);
                }

                // 3. Kiểm tra giới hạn mỗi người dùng (Per User Limit)
                if (orderData.userId && fs.per_user_limit > 0) {
                    const [userPreviousPurchases]: any = await connection.execute(
                        `SELECT SUM(oi.quantity) as total_bought
                         FROM order_items oi
                         JOIN orders o ON oi.order_id = o.id
                         WHERE o.user_id = ? 
                           AND oi.product_id = ? 
                           AND o.status != 'cancelled'
                           AND o.placed_at >= (SELECT start_time FROM flash_sales WHERE id = ?)`,
                        [orderData.userId, item.productId, fs.sale_id]
                    );

                    const totalBought = userPreviousPurchases[0].total_bought || 0;
                    if (totalBought + item.quantity > fs.per_user_limit) {
                        throw new Error(`Bạn đã đạt giới hạn mua hàng cho sản phẩm ${item.productName} trong đợt Sale này.`);
                    }
                }

                // 4. Tăng số lượng đã bán (quantity_sold)
                await connection.execute(
                    `UPDATE flash_sale_items SET quantity_sold = quantity_sold + ? WHERE id = ?`,
                    [item.quantity, fs.id]
                );
            }

            // Find variant_id for this product and size
            const [variants]: any = await connection.execute(
                `SELECT id, sku FROM product_variants WHERE product_id = ? AND size = ? LIMIT 1`,
                [item.productId, item.size]
            );
            const variantId = variants.length > 0 ? variants[0].id : null;
            const sku = variants.length > 0 ? variants[0].sku : null;

            verifiedSubtotal += actualUnitPrice * item.quantity;

            await connection.execute(
                `INSERT INTO order_items (order_id, product_id, product_variant_id, product_name, sku, size, quantity, unit_price, total_price, flash_sale_item_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.productId,
                    variantId,
                    item.productName,
                    sku,
                    item.size,
                    item.quantity,
                    actualUnitPrice,
                    actualUnitPrice * item.quantity,
                    flashSaleItemId
                ]
            );

            // Cập nhật inventory nếu tìm thấy variant_id
            if (variantId) {
                await connection.execute(
                    `UPDATE inventory 
            SET quantity = quantity - ?, reserved = reserved - ?
            WHERE product_variant_id = ? AND (quantity - reserved) >= 0`,
                    [item.quantity, 0, variantId]
                );

                // Ghi log inventory
                await connection.execute(
                    `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
           SELECT id, ?, 'order_placed', ?
           FROM inventory
           WHERE product_variant_id = ?`,
                    [-item.quantity, orderData.orderNumber, variantId]
                );
            }
        }

        // Cập nhật lại tổng tiền đơn hàng với giáo đã xác thực
        const finalSubtotal = verifiedSubtotal;
        const finalTotal = finalSubtotal + shippingFee - discount + tax;

        await connection.execute(
            `UPDATE orders SET subtotal = ?, total = ? WHERE id = ?`,
            [finalSubtotal, finalTotal, orderId]
        );

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
      ua.recipient_name as delivery_name,
      ua.phone as delivery_phone,
      ua.address_line as delivery_address,
      ua.city as delivery_city,
      ua.state as delivery_district,
      ua.postal_code as delivery_postal_code
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
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Cập nhật trạng thái đơn hàng
        await connection.execute(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?',
            [status, orderNumber]
        );

        // 2. Nếu trạng thái là 'delivered', tính điểm và cập nhật hạng thành viên
        if (status === 'delivered') {
            // Lấy thông tin đơn hàng
            const [orders]: any = await connection.execute(
                'SELECT id, user_id, total, giftcard_number, giftcard_discount FROM orders WHERE order_number = ?',
                [orderNumber]
            );

            if (orders.length > 0) {
                const order = orders[0];
                const userId = order.user_id;
                const total = Number(order.total);
                const orderId = order.id;

                // A. Tính điểm tích lũy
                if (userId) {
                    const pointsEarned = Math.floor(total / 10000);
                    if (pointsEarned > 0) {
                        const [users]: any = await connection.execute(
                            'SELECT accumulated_points FROM users WHERE id = ? FOR UPDATE',
                            [userId]
                        );
                        if (users.length > 0) {
                            const currentPoints = users[0].accumulated_points || 0;
                            const newPoints = currentPoints + pointsEarned;
                            let newTier = 'bronze';
                            if (newPoints >= 5000) newTier = 'gold';
                            else if (newPoints >= 1000) newTier = 'silver';
                            await connection.execute(
                                'UPDATE users SET accumulated_points = ?, membership_tier = ? WHERE id = ?',
                                [newPoints, newTier, userId]
                            );
                        }
                    }
                }

                // B. Xử lý trừ tiền thẻ quà tặng nếu có dùng
                if (order.giftcard_number && Number(order.giftcard_discount) > 0) {
                    const [giftCards]: any = await connection.execute(
                        'SELECT id, current_balance FROM gift_cards WHERE card_number = ? FOR UPDATE',
                        [order.giftcard_number]
                    );

                    if (giftCards.length > 0) {
                        const card = giftCards[0];
                        const deductAmount = Number(order.giftcard_discount);
                        const newBalance = Math.max(0, Number(card.current_balance) - deductAmount);

                        // Cập nhật số dư thẻ
                        await connection.execute(
                            'UPDATE gift_cards SET current_balance = ?, status = ? WHERE id = ?',
                            [newBalance, newBalance <= 0 ? 'used' : 'active', card.id]
                        );

                        // Ghi lại lịch sử giao dịch
                        await connection.execute(
                            `INSERT INTO gift_card_transactions 
                             (gift_card_id, transaction_type, amount, balance_before, balance_after, description, order_id)
                             VALUES (?, 'redeem', ?, ?, ?, ?, ?)`,
                            [
                                card.id,
                                deductAmount,
                                card.current_balance,
                                newBalance,
                                `Thanh toán cho đơn hàng ${orderNumber}`,
                                orderId
                            ]
                        );
                    }
                }
            }
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function cancelOrder(orderNumber: string | { orderNumber: string }, force: boolean = false) {
    const connection = await pool.getConnection();
    const actualOrderNumber = typeof orderNumber === 'string' ? orderNumber : orderNumber.orderNumber;

    try {
        await connection.beginTransaction();

        // Lấy order info
        const [order] = await connection.execute<any[]>(
            'SELECT id, status FROM orders WHERE order_number = ?',
            [actualOrderNumber]
        );

        if (!order || order.length === 0) {
            throw new Error('Order not found');
        }

        // Nếu không phải force (Admin), chỉ cho phép hủy đơn pending
        if (!force && order[0].status !== 'pending') {
            throw new Error('Can only cancel pending orders');
        }

        // Lấy order items
        const [items] = await connection.execute<any[]>(
            'SELECT product_id, size, quantity, flash_sale_item_id FROM order_items WHERE order_id = ?',
            [order[0].id]
        );

        // Hoàn lại stock sử dụng hệ thống inventory mới
        for (const item of items as any[]) {
            // Hoàn lại số lượng Flash Sale nếu có
            if (item.flash_sale_item_id) {
                await connection.execute(
                    `UPDATE flash_sale_items SET quantity_sold = quantity_sold - ? WHERE id = ?`,
                    [item.quantity, item.flash_sale_item_id]
                );
            }

            // Lấy variant_id của order item nếu có
            const [variantRows]: any = await connection.execute(
                'SELECT product_variant_id FROM order_items WHERE order_id = ? AND product_id = ? AND size = ? LIMIT 1',
                [order[0].id, item.product_id, item.size]
            );

            const variantId = variantRows[0]?.product_variant_id;
            if (variantId) {
                // Sử dụng hàm releaseStock từ variants.ts để cập nhật bảng inventory và ghi log
                // Lưu ý: releaseStock tự quản lý transaction riêng nếu gọi trực tiếp, 
                // nhưng ở đây chúng ta đang trong một transaction lớn.
                // Tuy nhiên releaseStock trong variants.ts lấy connection mới...
                // Tôi sẽ cập nhật trực tiếp ở đây để giữ tính atomic của transaction hiện tại
                // FIX: createOrder trừ quantity, nên cancelOrder phải cộng lại quantity
                await connection.execute(
                    `UPDATE inventory SET quantity = quantity + ? WHERE product_variant_id = ?`,
                    [item.quantity, variantId]
                );

                // Ghi log
                await connection.execute(
                    `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
           SELECT id, ?, 'order_cancelled', ?
           FROM inventory
           WHERE product_variant_id = ?`,
                    [item.quantity, actualOrderNumber, variantId]
                );
            }
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
    searchProductsForChat,
    getNewArrivalsForChat,
    getDiscountedProductsForChat,
    getProductsByCategoryForChat,
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
export async function getOrderStatusForChat(orderNumber: string) {
    try {
        const query = `
        SELECT o.order_number, o.status, o.total, o.payment_status, o.placed_at,
               (SELECT JSON_ARRAYAGG(JSON_OBJECT('name', product_name, 'quantity', quantity, 'price', price)) 
                FROM order_items WHERE order_id = o.id) as items
        FROM orders o
        WHERE o.order_number = ?
        LIMIT 1`;

        const [order]: any = await executeQuery<any[]>(query, [orderNumber]);
        return order;
    } catch (error) {
        console.error('Chatbot Order Status Error:', error);
        return null;
    }
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
