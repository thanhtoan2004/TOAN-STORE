const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

// Re-implementing encryption helpers for the script to avoid dependency issues
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

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function hashEmail(email) {
  if (!email) return '';
  const normalized = email.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

async function backfill() {
  console.log('Starting Email Hardening Backfill...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
  });

  try {
    // 1. Process users table
    const [users] = await conn.execute(
      'SELECT id, email, email_encrypted, is_encrypted FROM users WHERE email != "***"'
    );
    console.log(`Found ${users.length} users to process.`);

    for (const user of users) {
      let realEmail = '';
      if (user.is_encrypted && user.email_encrypted) {
        realEmail = decrypt(user.email_encrypted);
      } else {
        realEmail = user.email;
      }

      if (!realEmail || realEmail === '***') continue;

      const emailHash = hashEmail(realEmail);
      const emailEncrypted = encrypt(realEmail.toLowerCase().trim());

      await conn.execute(
        'UPDATE users SET email = "***", email_hash = ?, email_encrypted = ?, is_encrypted = TRUE WHERE id = ?',
        [emailHash, emailEncrypted, user.id]
      );
    }
    console.log('Users table backfilled successfully.');

    // 2. Process admin_users table
    const [admins] = await conn.execute(
      'SELECT id, email, email_encrypted, is_encrypted FROM admin_users WHERE email != "***"'
    );
    console.log(`Found ${admins.length} admins to process.`);

    for (const admin of admins) {
      let realEmail = '';
      if (admin.is_encrypted && admin.email_encrypted) {
        realEmail = decrypt(admin.email_encrypted);
      } else {
        realEmail = admin.email;
      }

      if (!realEmail || realEmail === '***') continue;

      const emailHash = hashEmail(realEmail);
      const emailEncrypted = encrypt(realEmail.toLowerCase().trim());

      await conn.execute(
        'UPDATE admin_users SET email = "***", email_hash = ?, email_encrypted = ?, is_encrypted = TRUE WHERE id = ?',
        [emailHash, emailEncrypted, admin.id]
      );
    }
    console.log('Admin users table backfilled successfully.');
  } catch (error) {
    console.error('Backfill failed:', error);
  } finally {
    await conn.end();
  }
}

backfill();
