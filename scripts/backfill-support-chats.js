const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

function hashEmail(email) {
  if (!email) return '';
  const normalized = email.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

async function backfillSupportChats() {
  console.log('Starting Support Chat Email Hardening Backfill...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
  });

  try {
    const [chats] = await conn.execute(
      'SELECT id, guest_email FROM support_chats WHERE guest_email != "***" AND guest_email IS NOT NULL'
    );
    console.log(`Found ${chats.length} guest chats to process.`);

    for (const chat of chats) {
      const emailHash = hashEmail(chat.guest_email);
      await conn.execute(
        'UPDATE support_chats SET guest_email = "***", guest_email_hash = ? WHERE id = ?',
        [emailHash, chat.id]
      );
    }
    console.log('Support chats backfilled successfully.');
  } catch (error) {
    console.error('Backfill failed:', error);
  } finally {
    await conn.end();
  }
}

backfillSupportChats();
