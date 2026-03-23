const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'toan_store',
  });
  try {
    const [tables] = await conn.execute("SHOW TABLES LIKE 'site_settings'");
    console.log('SITE SETTINGS TABLE EXIST:', tables.length > 0);
    if (tables.length > 0) {
      const [rows] = await conn.execute('SELECT * FROM site_settings');
      console.log('SITE SETTINGS ROWS COUNT:', rows.length);
      console.log(
        'SITE SETTINGS KEYS:',
        rows.map((r) => r.key)
      );
    }
  } catch (e) {
    console.error('DB ERROR:', e.message);
  }
  await conn.end();
}
run();
