import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function GET() {
    try {
        // Add payment_method if not exists
        try {
            await executeQuery('SELECT payment_method FROM orders LIMIT 1');
        } catch {
            await executeQuery(`ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cod'`);
        }

        // Add payment_status if not exists
        try {
            await executeQuery('SELECT payment_status FROM orders LIMIT 1');
        } catch {
            await executeQuery(`ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending'`);
        }

        // Add subtotal if not exists
        try {
            await executeQuery('SELECT subtotal FROM orders LIMIT 1');
        } catch {
            await executeQuery(`ALTER TABLE orders ADD COLUMN subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0`);
        }

        // Add tax if not exists
        try {
            await executeQuery('SELECT tax FROM orders LIMIT 1');
        } catch {
            await executeQuery(`ALTER TABLE orders ADD COLUMN tax DECIMAL(12, 2) DEFAULT 0`);
        }

        // Add discount if not exists
        try {
            await executeQuery('SELECT discount FROM orders LIMIT 1');
        } catch {
            await executeQuery(`ALTER TABLE orders ADD COLUMN discount DECIMAL(12, 2) DEFAULT 0`);
        }

        return NextResponse.json({ success: true, message: 'Orders table updated' });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
