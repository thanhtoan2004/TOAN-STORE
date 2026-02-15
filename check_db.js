const mysql = require('mysql2/promise');
async function run() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'nike_clone'
        });
        const [rows] = await connection.query('SHOW COLUMNS FROM orders');
        console.log(JSON.stringify(rows, null, 2));
        await connection.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
