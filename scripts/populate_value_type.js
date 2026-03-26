const mysql = require('mysql2/promise');

async function populateValueType() {
  const connection = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    console.log('--- Populating value_type in site_settings ---');

    await connection.execute(
      "UPDATE site_settings SET value_type = 'boolean' WHERE `key` = 'maintenance_mode'"
    );
    await connection.execute(
      "UPDATE site_settings SET value_type = 'number' WHERE `key` IN ('tax_rate', 'shipping_cost_domestic', 'shipping_cost_international', 'gift_wrap_fee')"
    );
    await connection.execute(
      "UPDATE site_settings SET value_type = 'json' WHERE value LIKE '{%' OR value LIKE '[%'"
    );
    await connection.execute(
      "UPDATE site_settings SET value_type = 'string' WHERE value_type IS NULL OR value_type = ''"
    );

    console.log('Populated value_type.');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await connection.end();
  }
}

populateValueType();
