import { createOrder, cancelOrder, executeQuery, pool } from '../src/lib/db/mysql';
import { format } from 'date-fns';

async function testFlashSaleEndToEnd() {
    console.log('--- STARTING FLASH SALE E2E TEST ---');

    try {
        // 1. SETUP: Create a test product and flash sale
        const sku = `TEST-FS-${Date.now()}`;
        console.log(`Creating test product: ${sku}`);
        const productResult = await executeQuery<any>(
            `INSERT INTO products (name, sku, slug, base_price, description, is_active) 
             VALUES (?, ?, ?, ?, ?, 1)`,
            ['Test Product Flash Sale', sku, sku.toLowerCase(), 1000000, 'Test Desc']
        );
        const productId = productResult.insertId;

        // Create variant
        const variantResult = await executeQuery<any>(
            `INSERT INTO product_variants (product_id, size, color, sku, price)
             VALUES (?, '42', 'Black', ?, 1000000)`,
            [productId, sku]
        );
        const variantId = variantResult.insertId;

        // Add inventory
        await executeQuery(
            `INSERT INTO inventory (product_variant_id, quantity, reserved) VALUES (?, 100, 0)`,
            [variantId]
        );

        // Create Flash Sale (Starting NOW, ending in 1 hour)
        console.log('Creating active flash sale...');
        const flashSaleResult = await executeQuery<any>(
            `INSERT INTO flash_sales (name, description, start_time, end_time, is_active)
             VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 1)`,
            ['Test Flash Sale', 'Testing E2E']
        );
        const flashSaleId = flashSaleResult.insertId;

        // Add item to flash sale (50% off, limit 5 qty, max 2 per user)
        const flashPrice = 500000;
        const qtyLimit = 5;
        console.log('DEBUG: Preparing to insert flash sale item with discount_percentage...');
        await executeQuery(
            `INSERT INTO flash_sale_items (flash_sale_id, product_id, flash_price, quantity_limit, quantity_sold, per_user_limit, discount_percentage) VALUES (?, ?, ?, ?, 0, 2, 50)`,
            [flashSaleId, productId, flashPrice, qtyLimit]
        );
        console.log('Flash sale created and active.');

        // 2. EXECUTION: Create Order
        console.log('Attempting to create order with Flash Sale price...');
        const orderNumber = `TEST-ORD-${Date.now()}`;
        const orderId = await createOrder({
            orderNumber,
            items: [{
                productId: productId,
                productName: 'Test Product Flash Sale',
                productImage: 'test.jpg',
                size: '42',
                quantity: 1,
                price: flashPrice // Client sends flash price
            }],
            shippingAddress: '123 Test St',
            phone: '0123456789',
            email: 'tester@example.com',
            paymentMethod: 'cod',
            paymentStatus: 'pending',
            totalAmount: flashPrice,
            shippingFee: 0,
            discount: 0,
            tax: 0,
            notes: 'Test Order'
        });
        console.log(`Order created: ID ${orderId}`);

        // 3. VERIFICATION
        console.log(`Verifying Order ID: ${orderId}`);

        // Debug: Check Order Table
        const [orderCheck] = await executeQuery<any[]>('SELECT * FROM orders WHERE id = ?', [orderId]);
        console.log('Order Record:', orderCheck[0]);

        // Debug: Check all items for this order
        const [allItems] = await executeQuery<any[]>('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
        console.log('All Order Items found:', allItems);

        // Verify Order Item Price
        const orderItemsResult = await executeQuery<any[]>(
            'SELECT unit_price, flash_sale_item_id FROM order_items WHERE order_id = ?',
            [orderId]
        );
        const item = orderItemsResult[0];
        console.log('Order Item Verification:', item);

        if (!item) {
            throw new Error('No order items found for verification!');
        }

        if (parseFloat(item.unit_price) !== flashPrice) {
            throw new Error(`Price mismatch! Expected ${flashPrice}, got ${item.unit_price}`);
        }
        if (!item.flash_sale_item_id) {
            throw new Error('flash_sale_item_id missing in order_item!');
        }

        // Verify Inventory Deduction (Flash Sale)
        const [fsItem] = await executeQuery<any[]>(
            'SELECT quantity_sold FROM flash_sale_items WHERE flash_sale_id = ? AND product_id = ?',
            [flashSaleId, productId]
        );
        console.log(`Flash Sale Quantity Sold: ${fsItem.quantity_sold} (Expected 1)`);
        if (fsItem.quantity_sold !== 1) throw new Error('Flash sale quantity_sold not updated!');

        // Verify Main Inventory Deduction (Quantity should be 99, Reserved 0)
        const [inventory] = await executeQuery<any[]>(
            'SELECT quantity, reserved FROM inventory WHERE product_variant_id = ?',
            [variantId]
        );
        console.log(`Inventory: Quantity=${inventory.quantity} (Expected 99), Reserved=${inventory.reserved} (Expected 0)`);

        if (inventory.quantity !== 99) throw new Error(`Main inventory quantity incorrect! Expected 99, got ${inventory.quantity}`);
        if (inventory.reserved !== 0) throw new Error(`Main inventory reserved incorrect! Expected 0, got ${inventory.reserved}`);

        // 4. CANCELLATION & ROLLBACK
        console.log('Cancelling order to test rollback...');
        // Get order number
        const orderResult = await executeQuery<any[]>('SELECT order_number FROM orders WHERE id = ?', [orderId]);
        const orderRec = orderResult[0]; // Get first row
        await cancelOrder(orderRec.order_number, true); // Force cancel as admin
        console.log('Order cancelled.');

        // Verify Rollback
        const [fsItemAfter] = await executeQuery<any[]>(
            'SELECT quantity_sold FROM flash_sale_items WHERE flash_sale_id = ? AND product_id = ?',
            [flashSaleId, productId]
        );
        console.log(`Flash Sale Quantity Sold After Cancel: ${fsItemAfter.quantity_sold} (Expected 0)`);
        if (fsItemAfter.quantity_sold !== 0) throw new Error('Flash sale rollback failed!');

        // Verify Main Inventory Restoration
        const [inventoryAfter] = await executeQuery<any[]>(
            'SELECT quantity FROM inventory WHERE product_variant_id = ?',
            [variantId]
        );
        console.log(`Inventory After Cancel: Quantity=${inventoryAfter.quantity} (Expected 100)`);
        if (inventoryAfter.quantity !== 100) throw new Error('Main inventory rollback failed! Quantity not restored.');

        console.log('--- TEST PASSED SUCCESSFULLY ---');

    } catch (error) {
        console.error('--- TEST FAILED ---');
        console.error(error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

testFlashSaleEndToEnd();
