import { initDb } from '../src/lib/db/init';
import { executeQuery } from '../src/lib/db/connection';
import { getWishlistItemsWithPriceDrop } from '../src/lib/db/repositories/wishlist';

async function verifyPriceDrop() {
    console.log('--- Bắt đầu Verification: Price Drop Alerts ---');

    // 1. Chạy DB init (chạy migration price_when_added)
    console.log('1. Khởi tạo DB & Migration...');
    await initDb();

    // Lấy test user
    const users: any = await executeQuery('SELECT id, email FROM users LIMIT 1');
    if (!users || users.length === 0) {
        console.log('Vui lòng tạo ít nhất 1 user trong DB trước.');
        process.exit(0);
    }
    const testUserId = users[0].id;

    // Lấy 1 sản phẩm
    const products: any = await executeQuery('SELECT id, base_price, retail_price FROM products LIMIT 1');
    const testProductId = products[0].id;

    console.log(`Tiến hành test với User ID: ${testUserId}, Product ID: ${testProductId}`);

    // 2. Clear wishlist query items của SP này để test sạch sẽ
    await executeQuery('DELETE wi FROM wishlist_items wi JOIN wishlists w ON wi.wishlist_id = w.id WHERE w.user_id = ? AND wi.product_id = ?', [testUserId, testProductId]);

    // 3. Fake ADD to wishlist với giá 1,000,000đ
    console.log('2. Giả lập Add To Wishlist với giá gốc = 1,000,000 đ');
    let wishlistId;
    const wls: any = await executeQuery('SELECT id FROM wishlists WHERE user_id = ? AND is_default = 1', [testUserId]);
    if (!wls || wls.length === 0) {
        const res: any = await executeQuery('INSERT INTO wishlists (user_id, name, is_default) VALUES (?, ?, ?)', [testUserId, 'My Wishlist', 1]);
        wishlistId = res.insertId;
    } else {
        wishlistId = wls[0].id;
    }

    await executeQuery(
        'INSERT INTO wishlist_items (wishlist_id, product_id, price_when_added) VALUES (?, ?, ?)',
        [wishlistId, testProductId, 1000000]
    );

    // 4. Update Product trong DB để có giá 800,000đ (Sale price)
    console.log('3. Giả lập Flash Sale (Giảm giá SP xuống 800,000 đ)');
    const originalRetailPrice = products[0].retail_price;
    const originalBasePrice = products[0].base_price;

    await executeQuery('UPDATE products SET retail_price = 1000000, base_price = 800000 WHERE id = ?', [testProductId]);

    // 5. Chạy query lấy Price Drop
    console.log('4. Cấu hình xong, gọi getWishlistItemsWithPriceDrop()...');
    const items = await getWishlistItemsWithPriceDrop();

    // Dump check
    const raw: any = await executeQuery('SELECT * FROM wishlist_items WHERE product_id = ?', [testProductId]);
    console.log('--- DB Raw Wishlist ---');
    console.log(raw);
    console.log('-----------------------');

    const found = items.find((i: any) => i.user_id === testUserId && i.product_id === testProductId);
    if (found) {
        console.log('✅ TEST PASSED: Đã catch được sản phẩm giảm giá!');
        console.dir(found);
    } else {
        console.log('❌ TEST FAILED: Không query được sản phẩm giảm giá.');
        console.log('Danh sách Items return:', items);
    }

    // Restore giá trị ban đầu (Cleanup)
    console.log('5. Phục hồi dữ liệu giá gốc...');
    await executeQuery('UPDATE products SET retail_price = ?, base_price = ? WHERE id = ?', [originalRetailPrice, originalBasePrice, testProductId]);
    await executeQuery('DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?', [wishlistId, testProductId]);

    process.exit(0);
}

verifyPriceDrop().catch(console.error);
