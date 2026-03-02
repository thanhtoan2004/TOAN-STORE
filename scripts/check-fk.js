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
        const [rows] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE CONSTRAINT_NAME = 'fk_inventory_warehouse' 
      AND TABLE_SCHEMA = '${dbConfig.database}'
    `);

        if (rows.length > 0) {
            console.log('✅ FK fk_inventory_warehouse EXISTS');
        } else {
            console.log('❌ FK fk_inventory_warehouse MISSING');
        }
    } catch (err) {
        console.error(err);
    } finally {
        connection.end();
    }
}

check();
