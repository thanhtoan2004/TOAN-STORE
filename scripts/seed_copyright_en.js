const mysql = require('mysql2/promise');

async function seedSettings() {
  const connection = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    console.log('--- Seeding English Copyright Setting ---');

    const copyrightTextEn = JSON.stringify('© 2026 TOAN Store, Inc. All Rights Reserved.');

    const [existing] = await connection.execute('SELECT id FROM site_settings WHERE `key` = ?', [
      'copyright_text_en',
    ]);

    if (existing.length === 0) {
      await connection.execute('INSERT INTO site_settings (`key`, value) VALUES (?, ?)', [
        'copyright_text_en',
        copyrightTextEn,
      ]);
      console.log('Inserted copyright_text_en setting.');
    } else {
      await connection.execute('UPDATE site_settings SET value = ? WHERE `key` = ?', [
        copyrightTextEn,
        'copyright_text_en',
      ]);
      console.log('Updated copyright_text_en setting.');
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await connection.end();
  }
}

seedSettings();
