const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyDb() {
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

        // 1. Kiểm tra danh sách bảng
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);

        console.log(`\n✅ Tổng số bảng hiện tại: ${tableNames.length}`);
        console.log('Danh sách các bảng mới rà soát:');
        const importantMissingTables = ['product_variants', 'inventory', 'coupons', 'banners', 'vouchers', 'flash_sales', 'stores', 'roles'];

        importantMissingTables.forEach(t => {
            if (tableNames.includes(t)) {
                console.log(`  - [OK] ${t}`);
            } else {
                console.log(`  - [MISSING] ${t} ❌`);
            }
        });

        // 2. Kiểm tra các cột SEO/Tính năng mới trong products
        console.log('\n--- KIỂM TRA CẤU TRÚC BẢNG products ---');
        const [productCols] = await connection.query('SHOW COLUMNS FROM products');
        const prodColNames = productCols.map(c => c.Field);
        const newProdCols = ['is_featured', 'view_count', 'sale_count', 'meta_title', 'meta_description', 'sport_id'];

        newProdCols.forEach(c => {
            if (prodColNames.includes(c)) {
                console.log(`  - [OK] Cột ${c} đã hiện diện`);
            } else {
                console.log(`  - [MISSING] Cột ${c} chưa có ❌`);
            }
        });

        // 3. Kiểm tra orders
        console.log('\n--- KIỂM TRA CẤU TRÚC BẢNG orders ---');
        const [orderCols] = await connection.query('SHOW COLUMNS FROM orders');
        const orderColNames = orderCols.map(c => c.Field);
        const newOrderCols = ['currency', 'tracking_number', 'voucher_code', 'giftcard_number', 'shipping_address_snapshot'];

        newOrderCols.forEach(c => {
            if (orderColNames.includes(c)) {
                console.log(`  - [OK] Cột ${c} đã hiện diện`);
            } else {
                console.log(`  - [MISSING] Cột ${c} chưa có ❌`);
            }
        });

        await connection.end();
        console.log('\n--- KẾT THÚC KIỂM TRA ---');

    } catch (error) {
        console.error('\n❌ LỖI KẾT NỐI DATABASE:', error.message);
        if (connection) await connection.end();
    }
}

verifyDb();
