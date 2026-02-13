const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

async function checkColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'nike_clone',
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        console.log('--- WAREHOUSES ---');
        const [wCols] = await connection.execute('SHOW COLUMNS FROM warehouses');
        console.log(JSON.stringify(wCols, null, 2));

        console.log('\n--- ORDERS ---');
        const [oCols] = await connection.execute('SHOW COLUMNS FROM orders');
        console.log(JSON.stringify(oCols, null, 2));

        console.log('\n--- ORDER ITEMS ---');
        const [oiCols] = await connection.execute('SHOW COLUMNS FROM order_items');
        console.log(JSON.stringify(oiCols, null, 2)); g(JSON.stringify(oiCols, null, 2));

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await connection.end();
    }
}

checkColumns();
