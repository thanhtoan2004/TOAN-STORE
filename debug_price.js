
const mysql = require('mysql2/promise');

async function checkPrice() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'nike_clone',
        password: process.env.DB_PASSWORD,
    });

    try {
        const [rows] = await connection.execute(
            'SELECT id, name, base_price, retail_price FROM products WHERE name LIKE ?',
            ['%Nike Mercurial Vapor 16 Elite%']
        );
        console.log('Products found:', rows);
    } catch (err) {
        console.error(err);
    } finally {
        connection.end();
    }
}

checkPrice();
