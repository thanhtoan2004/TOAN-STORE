const mysql = require('mysql2/promise');
async function run() {
  const connection = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  const [rows] = await connection.execute('SELECT `key` FROM site_settings');
  console.log('KEYS:', rows.map((r) => r.key).join(' | '));
  await connection.end();
}
run();
