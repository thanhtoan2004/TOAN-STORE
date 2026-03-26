const mysql = require('mysql2/promise');

async function updateSchema() {
  const connection = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    console.log('--- Updating site_settings schema for compatibility ---');

    // 1. Add value_type column if it doesn't exist
    const [columns] = await connection.execute('SHOW COLUMNS FROM site_settings LIKE "value_type"');
    if (columns.length === 0) {
      await connection.execute(
        'ALTER TABLE site_settings ADD COLUMN value_type VARCHAR(50) DEFAULT "string"'
      );
      console.log('Added value_type column to site_settings.');
    } else {
      console.log('value_type already exists in site_settings.');
    }

    // 2. We already dropped settings table in the previous cleanup script.

    // 3. Make sure we have the site_settings table ready.
    console.log('--- Done ---');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await connection.end();
  }
}

updateSchema();
