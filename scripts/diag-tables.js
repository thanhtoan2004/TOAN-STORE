const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
  });

  try {
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map((r) => Object.values(r)[0]);
    console.log('Tables:', tableNames.filter((t) => t.includes('order')).join(', '));

    for (const table of tableNames.filter((t) => t.includes('order'))) {
      const [columns] = await connection.execute(`SHOW COLUMNS FROM \`${table}\``);
      console.log(`\nColumns for ${table}:`, columns.map((c) => c.Field).join(', '));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTables();
