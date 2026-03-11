const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toan_store',
};

async function investigate() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('--- PHASE 11 INVESTIGATION ---');

  // 1. Promotion Codes
  const [[v]] = await connection.execute(
    'SELECT COUNT(*) as count FROM vouchers WHERE code = "TOAN"'
  );
  const [[c]] = await connection.execute(
    'SELECT COUNT(*) as count FROM coupons WHERE code = "TOAN"'
  );
  console.log(`Code 'TOAN' count: vouchers=${v.count}, coupons=${c.count}`);

  // 2. Settings Keys
  const [s] = await connection.execute('SELECT `key`, value FROM settings ORDER BY `key`');
  console.log('Duplicate settings keys check:');
  const keys = s.map((r) => r.key);
  ['name', 'email', 'phone', 'address', 'city', 'country', 'currency'].forEach((word) => {
    const matches = keys.filter((k) => k.includes(word));
    if (matches.length > 1) {
      console.log(`Potential matches for '${word}':`, matches);
    }
  });

  // 3. Triggers
  const [tr] = await connection.execute('SHOW TRIGGERS');
  console.log(
    'Active Triggers:',
    tr.map((r) => r.Trigger)
  );

  // 4. Inventory Warehouses
  const [inv] = await connection.execute(
    'SELECT warehouse_id, COUNT(*) as count FROM inventory GROUP BY warehouse_id'
  );
  console.log('Inventory per warehouse:', inv);

  // 5. User names
  const [users] = await connection.execute(
    'SELECT id, full_name, first_name, last_name FROM users LIMIT 5'
  );
  console.log('User name samples:', users);

  // 6. Flash Sales
  const [fs] = await connection.execute(
    'SELECT id, name, is_active, end_date FROM flash_sales WHERE end_date < NOW() AND is_active = 1'
  );
  console.log('Expired but active flash sales:', fs.length);

  await connection.end();
}

investigate().catch(console.error);
