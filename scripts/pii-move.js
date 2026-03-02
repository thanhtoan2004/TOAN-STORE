const mysql = require('mysql2/promise');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long!!';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function main() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'toan_store'
    };

    console.log('🚀 Starting PII Manual Migration...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        // 1. User Addresses
        console.log('Processing user_addresses...');
        const [addresses] = await connection.execute('SELECT id, phone, address_line FROM user_addresses WHERE is_encrypted = 0 OR phone_encrypted IS NULL');
        for (const addr of addresses) {
            const phoneEnc = encrypt(addr.phone);
            const addrEnc = encrypt(addr.address_line);
            await connection.execute(
                'UPDATE user_addresses SET phone_encrypted = ?, address_encrypted = ?, phone = "***", address_line = "***", is_encrypted = 1 WHERE id = ?',
                [phoneEnc, addrEnc, addr.id]
            );
        }
        console.log(`✅ Migrated ${addresses.length} addresses.`);

        // 2. Orders
        console.log('Processing orders...');
        const [orders] = await connection.execute('SELECT id, phone, email FROM orders WHERE is_encrypted = 0 OR phone_encrypted IS NULL');
        for (const order of orders) {
            const phoneEnc = encrypt(order.phone);
            const emailEnc = encrypt(order.email);
            await connection.execute(
                'UPDATE orders SET phone_encrypted = ?, email_encrypted = ?, phone = "***", email = "***", is_encrypted = 1 WHERE id = ?',
                [phoneEnc, emailEnc, order.id]
            );
        }
        console.log(`✅ Migrated ${orders.length} orders.`);

        // 3. Users
        console.log('Processing users...');
        const [users] = await connection.execute('SELECT id, phone, date_of_birth FROM users WHERE is_encrypted = 0 OR phone_encrypted IS NULL');
        for (const user of users) {
            const phoneEnc = encrypt(user.phone || '');
            const dobEnc = encrypt(user.date_of_birth ? user.date_of_birth.toISOString() : '');
            await connection.execute(
                'UPDATE users SET phone_encrypted = ?, date_of_birth_encrypted = ?, phone = "***", is_encrypted = 1 WHERE id = ?',
                [phoneEnc, dobEnc, user.id]
            );
        }
        console.log(`✅ Migrated ${users.length} users.`);

        console.log('🎉 PII Migration Completed Successfully!');
    } catch (err) {
        console.error('❌ Migration Error:', err);
    } finally {
        await connection.end();
    }
}

main();
