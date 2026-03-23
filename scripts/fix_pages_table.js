const mysql = require('mysql2/promise');

async function fixPagesTable() {
  const connection = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    console.log('--- Fixing pages table ---');

    // Check current structure
    const [fields] = await connection.execute('DESCRIBE pages');
    const fieldNames = fields.map((f) => f.Field);
    console.log('Current fields:', fieldNames.join(', '));

    if (fieldNames.includes('is_active') && fieldNames.includes('meta_title')) {
      console.log('Columns is_active and meta_title already exist.');
    }

    // It is safer to rename and recreate to ensure perfect match with schema.ts
    const backupName = 'pages_backup_' + Date.now();
    console.log(`Backing up to ${backupName}...`);
    await connection.execute(`RENAME TABLE pages TO ${backupName}`);

    console.log('Creating new pages table...');
    await connection.execute(`
      CREATE TABLE pages (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content LONGTEXT,
        is_active TINYINT DEFAULT 1,
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Restore data if possible
    console.log('Attempting to restore data from backup...');
    try {
      // Filter out old fields like 'template', 'category', 'created_by' which are not in the new table
      await connection.execute(`
         INSERT INTO pages (title, slug, content, is_active, meta_title, meta_description, created_at)
         SELECT title, slug, content, is_active, meta_title, meta_description, created_at
         FROM ${backupName}
       `);
      console.log('Data restored successfully.');
    } catch (restoreErr) {
      console.warn('Could not restore all data automatically:', restoreErr.message);
      console.warn('Manual migration from ' + backupName + ' might be needed.');
    }

    console.log('--- Fix complete ---');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await connection.end();
  }
}

fixPagesTable();
