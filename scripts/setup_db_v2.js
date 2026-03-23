const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'toan_store',
  });

  try {
    console.log('--- Database Setup Start ---');

    console.log('1. Creating site_settings table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        \`key\` VARCHAR(100) UNIQUE NOT NULL,
        \`value\` JSON,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('2. Creating menu_items table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        parent_id BIGINT UNSIGNED,
        location VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        href VARCHAR(500),
        icon VARCHAR(100),
        display_order INT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('3. Seeding site_settings...');
    const social = {
      facebook: 'https://www.facebook.com/dtt694',
      instagram: 'https://www.instagram.com/dt.toan69',
      youtube: 'https://www.youtube.com/@thanhhtoann',
      twitter: 'https://twitter.com/dttoan69',
    };
    await conn.execute(
      'INSERT IGNORE INTO site_settings (\`key\`, \`value\`, description) VALUES (?, ?, ?)',
      ['social_links', JSON.stringify(social), 'Links to social media accounts']
    );

    console.log('4. Seeding header menu items...');
    const headerLinks = [
      { title: 'New & Featured', href: '/categories?sort=newest', order: 1 },
      { title: 'Men', href: '/men', order: 2 },
      { title: 'Women', href: '/women', order: 3 },
      { title: 'Kids', href: '/kids', order: 4 },
      { title: 'Jordan', href: '/categories?sport=basketball', order: 5 },
      { title: 'Sports', href: '/categories?sport=running', order: 6 },
      { title: 'News', href: '/news', order: 7 },
    ];
    for (const l of headerLinks) {
      // Check if exists first to avoid duplicate if INSERT IGNORE fails on primary key
      const [rows] = await conn.execute(
        'SELECT id FROM menu_items WHERE title = ? AND location = ?',
        [l.title, 'header']
      );
      if (rows.length === 0) {
        await conn.execute(
          'INSERT INTO menu_items (location, title, href, display_order, is_active) VALUES (?, ?, ?, ?, 1)',
          ['header', l.title, l.href, l.order]
        );
      }
    }

    console.log('5. Seeding footer help menu items...');
    const footerHelp = [
      { title: 'Help Center', href: '/help' },
      { title: 'Order Status', href: '/orders' },
      { title: 'Shipping & Delivery', href: '/help/shipping-delivery' },
      { title: 'Returns', href: '/help/returns' },
      { title: 'Order Cancellation', href: '/help/order-cancellation' },
      { title: 'Payment Options', href: '/help/payment-options' },
      { title: 'Contact Us', href: '/help/contact' },
    ];
    for (let i = 0; i < footerHelp.length; i++) {
      const [rows] = await conn.execute(
        'SELECT id FROM menu_items WHERE title = ? AND location = ?',
        [footerHelp[i].title, 'footer_help']
      );
      if (rows.length === 0) {
        await conn.execute(
          'INSERT INTO menu_items (location, title, href, display_order, is_active) VALUES (?, ?, ?, ?, 1)',
          ['footer_help', footerHelp[i].title, footerHelp[i].href, i]
        );
      }
    }

    console.log('--- Database Setup Finished ---');
  } catch (err) {
    console.error('ERROR during setup:', err);
  } finally {
    await conn.end();
  }
}

run();
