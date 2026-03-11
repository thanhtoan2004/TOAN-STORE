const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

// Re-implementing encryption helpers for the script
const ALGORITHM = 'aes-256-gcm';
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY || 'default-secret-key-must-be-changed-in-production';
  return crypto.createHash('sha256').update(key).digest();
}

function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  try {
    const parts = encryptedText.split(':');
    if (parts.length < 3) return encryptedText;
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return encryptedText;
  }
}

function hashEmail(email) {
  if (!email) return '';
  const normalized = email.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

async function backfill() {
  console.log('Starting Newsletter and Orders Backfill...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
  });

  try {
    // 1. Process newsletter_subscriptions
    const [news] = await conn.execute(
      'SELECT id, email FROM newsletter_subscriptions WHERE email != "***"'
    );
    console.log(`Found ${news.length} newsletter subscriptions to process.`);

    for (const sub of news) {
      const emailHash = hashEmail(sub.email);
      await conn.execute(
        'UPDATE newsletter_subscriptions SET email = "***", email_hash = ? WHERE id = ?',
        [emailHash, sub.id]
      );
    }
    console.log('Newsletter subscriptions backfilled.');

    // 2. Process orders
    const [orders] = await conn.execute(
      'SELECT id, shipping_address_snapshot, is_encrypted FROM orders WHERE email_hash IS NULL'
    );
    console.log(`Found ${orders.length} orders to process.`);

    for (const order of orders) {
      try {
        let snapshot = order.shipping_address_snapshot;
        if (typeof snapshot === 'string') {
          snapshot = JSON.parse(snapshot);
        }

        let rawEmail = snapshot.email;
        if (order.is_encrypted && rawEmail && rawEmail.includes(':')) {
          rawEmail = decrypt(rawEmail);
        }

        if (rawEmail) {
          const emailHash = hashEmail(rawEmail);
          await conn.execute(
            'UPDATE orders SET email = "***", phone = "***", email_hash = ? WHERE id = ?',
            [emailHash, order.id]
          );
        }
      } catch (e) {
        console.warn(`Failed to process order ${order.id}:`, e.message);
      }
    }
    console.log('Orders backfilled.');
  } catch (error) {
    console.error('Backfill failed:', error);
  } finally {
    await conn.end();
  }
}

backfill();
