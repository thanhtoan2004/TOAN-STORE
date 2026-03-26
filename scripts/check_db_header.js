const mysql = require('mysql2/promise');

async function check() {
  try {
    const conn = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
    const [rows] = await conn.execute(
      'SELECT title, title_en, location FROM menu_items WHERE location = "header"'
    );
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
  } catch (e) {
    console.error(e.message);
  }
}

check();
