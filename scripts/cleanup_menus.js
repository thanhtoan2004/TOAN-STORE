const mysql = require('mysql2/promise');

async function cleanup() {
  const connection = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    console.log('--- Cleaning up duplicate menu items ---');
    // We only want to keep items that have both title and title_en (seeded by our new script)
    // or just delete all and re-seed. Re-seeding is safer to ensure consistency.
    await connection.execute('DELETE FROM menu_items');
    console.log('Deleted all items from menu_items.');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await connection.end();
  }
}

cleanup();
