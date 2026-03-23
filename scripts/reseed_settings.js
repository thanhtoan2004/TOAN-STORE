const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'toan_store',
  });

  try {
    const defaultSettings = {
      store_name: 'TOAN Store',
      store_email: 'admin@toanstore.com',
      store_phone: '0123456789',
      store_address: '123 Main Street',
      store_city: 'Hanoi',
      store_country: 'Vietnam',
      store_currency: 'VND',
      tax_rate: 0.1,
      shipping_cost_domestic: 30000,
      shipping_cost_international: 100000,
      facebook: 'https://www.facebook.com/dtt694',
      instagram: 'https://www.instagram.com/dt.toan69',
      youtube: 'https://www.youtube.com/@thanhhtoann',
      twitter: 'https://twitter.com/dttoan69',
    };

    console.log('--- Reseeding Site Settings ---');
    for (const [k, v] of Object.entries(defaultSettings)) {
      // Use standard INSERT or UPDATE directly
      await conn.execute(
        'INSERT INTO site_settings (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)',
        [k, JSON.stringify(v)]
      );
      console.log(`Saved key: ${k}`);
    }

    // Also update the legacy JSON object if it exists
    await conn.execute(
      'INSERT INTO site_settings (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)',
      [
        'social_links',
        JSON.stringify({
          facebook: defaultSettings.facebook,
          instagram: defaultSettings.instagram,
          youtube: defaultSettings.youtube,
          twitter: defaultSettings.twitter,
        }),
      ]
    );

    console.log('--- Reseed Finished ---');
  } catch (err) {
    console.error('SEED ERROR:', err);
  } finally {
    await conn.end();
  }
}

run();
