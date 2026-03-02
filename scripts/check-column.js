const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store'
};

async function check() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [columns] = await connection.query("SHOW COLUMNS FROM inventory LIKE 'warehouse_id'");
        if (columns.length > 0) {
            console.log('✅ Column warehouse_id EXISTS');
        } else {
            console.log('❌ Column warehouse_id MISSING');
        }
    } catch (err) {
        console.error(err);
    } finally {
        connection.end();
    }
}

check();
