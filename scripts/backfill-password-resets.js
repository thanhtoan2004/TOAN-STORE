const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

function hashEmail(email) {
  if (!email) return '';
  const normalized = email.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

async function backfillPasswordResets() {
  console.log('Starting Password Resets Email Hardening Backfill...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
  });

  try {
    const [resets] = await conn.execute(
      'SELECT id, email FROM password_resets WHERE email != "***" AND email IS NOT NULL'
    );
    console.log(`Found ${resets.length} password resets to process.`);

    for (const reset of resets) {
      const emailHash = hashEmail(reset.email);
      await conn.execute('UPDATE password_resets SET email = "***", email_hash = ? WHERE id = ?', [
        emailHash,
        reset.id,
      ]);
    }
    console.log('Password resets backfilled successfully.');
  } catch (error) {
    console.error('Backfill failed:', error);
  } finally {
    await conn.end();
  }
}

backfillPasswordResets();
