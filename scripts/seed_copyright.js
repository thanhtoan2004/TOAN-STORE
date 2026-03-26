const mysql = require('mysql2/promise');

async function seedSettings() {
  const connection = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    console.log('--- Seeding Copyright Setting (JSON compatible) ---');

    // Since the column 'value' is type JSON, we must provide a valid JSON string.
    // A plain string in JSON is "string contents" (with quotes).
    const copyrightText = JSON.stringify('© 2026 TOAN Store, Inc. Bảo lưu mọi quyền.');

    const [existing] = await connection.execute('SELECT id FROM site_settings WHERE `key` = ?', [
      'copyright_text',
    ]);

    if (existing.length === 0) {
      await connection.execute('INSERT INTO site_settings (`key`, value) VALUES (?, ?)', [
        'copyright_text',
        copyrightText,
      ]);
      console.log('Inserted copyright_text setting.');
    } else {
      await connection.execute('UPDATE site_settings SET value = ? WHERE `key` = ?', [
        copyrightText,
        'copyright_text',
      ]);
      console.log('Updated copyright_text setting.');
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await connection.end();
  }
}

seedSettings();
