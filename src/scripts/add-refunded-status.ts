
import { executeQuery } from '../lib/db/mysql';

async function main() {
    try {
        console.log('Adding "refunded" status to orders table...');
        await executeQuery(
            "ALTER TABLE orders MODIFY COLUMN status ENUM('pending','pending_payment_confirmation','payment_received','confirmed','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending'",
            []
        );
        console.log('Successfully added "refunded" status.');
    } catch (error) {
        console.error('Error adding status:', error);
    }
}

main();
