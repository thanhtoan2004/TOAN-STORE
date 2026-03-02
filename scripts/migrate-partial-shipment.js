const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'toan_store',
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        console.log('📦 Starting Partial Shipment Migration...');

        // 1. Create shipments table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS shipments (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                order_id BIGINT UNSIGNED NOT NULL,
                warehouse_id BIGINT UNSIGNED NULL,
                tracking_code VARCHAR(100) UNIQUE,
                carrier VARCHAR(50) DEFAULT 'manual',
                status ENUM('pending', 'shipped', 'delivered', 'returned', 'cancelled') DEFAULT 'pending',
                shipped_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                INDEX idx_order_id (order_id),
                INDEX idx_tracking_code (tracking_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Created table: shipments');

        // 2. Create shipment_items table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS shipment_items (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                shipment_id BIGINT UNSIGNED NOT NULL,
                order_item_id BIGINT UNSIGNED NOT NULL,
                quantity INT NOT NULL,
                FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
                FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Created table: shipment_items');

        console.log('🚀 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

migrate();
