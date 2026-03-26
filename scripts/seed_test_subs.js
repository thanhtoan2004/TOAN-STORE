const mysql = require('mysql2/promise');

async function seed() {
  const c = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    await c.execute(`
      INSERT IGNORE INTO newsletter_subscriptions (email, name, email_hash, is_encrypted, status) 
      VALUES 
        ('toan@example.com', 'Toàn', 'dummyhash1', 0, 'active'), 
        ('lan@example.com', 'Lan', 'dummyhash2', 0, 'active')
    `);
    console.log('Seeded 2 test subscribers with names');
  } finally {
    await c.end();
  }
}

seed();
