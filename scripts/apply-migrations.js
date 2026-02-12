const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyMigrations() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nike_clone',
        port: parseInt(process.env.DB_PORT) || 3306
    };

    console.log(`\n--- ĐANG KẾT NỐI ĐẾN DATABASE: ${config.database} ---`);

    let connection;
    try {
        connection = await mysql.createConnection(config);

        console.log('Đang rà soát và áp dụng các cột thiếu cho products...');
        const [prodCols] = await connection.query('SHOW COLUMNS FROM products');
        const prodColNames = prodCols.map(c => c.Field);

        const prodMigrations = [
            { name: 'is_featured', sql: 'ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER is_active' },
            { name: 'is_new_arrival', sql: 'ALTER TABLE products ADD COLUMN is_new_arrival TINYINT(1) DEFAULT 1 AFTER is_featured' },
            { name: 'view_count', sql: 'ALTER TABLE products ADD COLUMN view_count INT DEFAULT 0 AFTER is_new_arrival' },
            { name: 'sale_count', sql: 'ALTER TABLE products ADD COLUMN sale_count INT DEFAULT 0 AFTER view_count' },
            { name: 'meta_title', sql: 'ALTER TABLE products ADD COLUMN meta_title VARCHAR(255) AFTER sale_count' },
            { name: 'meta_description', sql: 'ALTER TABLE products ADD COLUMN meta_description TEXT AFTER meta_title' }
        ];

        for (const m of prodMigrations) {
            if (!prodColNames.includes(m.name)) {
                console.log(`  -> Đang thêm cột ${m.name}...`);
                await connection.query(m.sql);
            } else {
                console.log(`  -> Cột ${m.name} đã tồn tại.`);
            }
        }

        console.log('\nĐang rà soát và áp dụng các cột thiếu cho categories...');
        const [catCols] = await connection.query('SHOW COLUMNS FROM categories');
        const catColNames = catCols.map(c => c.Field);

        if (!catColNames.includes('meta_title')) {
            console.log('  -> Đang thêm meta_title cho categories...');
            await connection.query('ALTER TABLE categories ADD COLUMN meta_title VARCHAR(255) AFTER is_active');
        }
        if (!catColNames.includes('meta_description')) {
            console.log('  -> Đang thêm meta_description cho categories...');
            await connection.query('ALTER TABLE categories ADD COLUMN meta_description TEXT AFTER meta_title');
        }

        console.log('\n--- HOÀN TẤT CẬP NHẬT SCHEMA ---');
        await connection.end();

    } catch (error) {
        console.error('\n❌ LỖI:', error.message);
        if (connection) await connection.end();
    }
}

applyMigrations();
