const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toan_store',
};

async function check() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('--- PHASE 9 VERIFICATION REPORT ---');

    // 1. Check stock_reservations
    const [srCols] = await connection.execute('DESCRIBE stock_reservations');
    const srFields = srCols.map((c) => c.Field);
    console.log('stock_reservations columns:', srFields.join(', '));
    const hasItems = srFields.includes('items');
    console.log('Result: items column dropped?', !hasItems);

    // 2. Check stock_reservation_items
    const [sriCols] = await connection.execute('SHOW TABLES LIKE "stock_reservation_items"');
    console.log('Result: stock_reservation_items exists?', sriCols.length > 0);

    // 3. Check users email encryption
    const [users] = await connection.execute(
      'SELECT COUNT(*) as total, SUM(is_email_encrypted) as encrypted FROM users'
    );
    console.log(`Result: Users total=${users[0].total}, Encrypted=${users[0].encrypted}`);

    const [sample] = await connection.execute('SELECT email, email_encrypted FROM users LIMIT 1');
    if (sample.length > 0) {
      console.log('Sample email (masked):', sample[0].email);
      console.log('Sample encrypted:', sample[0].email_encrypted ? 'YES' : 'NO');
    }

    // 4. Check Foreign Keys
    const [fks] = await connection.execute(`
            SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = '${dbConfig.database}' 
            AND CONSTRAINT_NAME IN ('fk_orders_voucher', 'fk_admin_users_role', 'fk_transfers_from_warehouse', 'fk_transfers_to_warehouse', 'fk_transfers_variant')
        `);
    console.log('Active Foreign Keys:');
    const foundFks = fks.map((f) => f.CONSTRAINT_NAME);
    ['fk_orders_voucher', 'fk_admin_users_role', 'fk_transfers_variant'].forEach((name) => {
      console.log(` - ${name}: ${foundFks.includes(name) ? 'PRESENT' : 'MISSING'}`);
    });

    // 5. Check products gender
    const [prodCols] = await connection.execute('DESCRIBE products');
    const hasGender = prodCols.some((c) => c.Field === 'gender');
    console.log('Result: products.gender exists?', hasGender);

    console.log('--- END OF REPORT ---');
  } catch (error) {
    console.error('Verification Error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

check();
