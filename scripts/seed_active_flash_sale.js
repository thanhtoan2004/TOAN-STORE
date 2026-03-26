const mysql = require('mysql2/promise');

async function setupFlashSale() {
  const c = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1. Create Flash Sale
    const [fsResult] = await c.execute(
      'INSERT INTO flash_sales (name, description, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?)',
      ['Flash Sale Hôm Nay', 'Cơ hội vàng để săn giày hiệu giá hời!', now, tomorrow, 1]
    );
    const flashSaleId = fsResult.insertId;

    // 2. Add products
    const productIds = [1, 2, 3]; // Assuming these exist
    for (const pid of productIds) {
      const [p] = await c.execute('SELECT price_cache FROM products WHERE id = ?', [pid]);
      if (p.length > 0) {
        const originalPrice = parseFloat(p[0].price_cache);
        const flashPrice = Math.round(originalPrice * 0.7); // 30% off
        const discountPercentage = 30;

        await c.execute(
          'INSERT INTO flash_sale_items (flash_sale_id, product_id, flash_price, discount_percentage, quantity_limit, quantity_sold) VALUES (?, ?, ?, ?, ?, ?)',
          [flashSaleId, pid, flashPrice, discountPercentage, 50, 5]
        );
      }
    }

    console.log('Flash Sale created successfully with ID:', flashSaleId);
  } finally {
    await c.end();
  }
}

setupFlashSale();
