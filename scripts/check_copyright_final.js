const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  const [rows] = await conn.execute("SELECT * FROM site_settings WHERE `key` = 'copyright_text'");
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
}

check().catch(console.error);
