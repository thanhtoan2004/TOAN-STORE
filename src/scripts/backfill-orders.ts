import { pool } from '../lib/db/connection';
import { decrypt } from '../lib/encryption';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function backfillOrders() {
  const connection = await pool.getConnection();
  try {
    console.log('--- Starting Orders Backfill (Phase 1 Split) ---');

    // 1. Get all orders that don't have shipping/payment details yet
    const [orders]: any = await connection.execute(`
      SELECT o.* FROM orders o
      LEFT JOIN order_shipping_details osd ON o.id = osd.order_id
      LEFT JOIN order_payment_details opd ON o.id = opd.order_id
      WHERE osd.id IS NULL OR opd.id IS NULL
    `);

    console.log(`Found ${orders.length} orders to backfill.`);

    for (const order of orders) {
      // ARC-01: Backfill order_shipping_details
      let shippingAddr: any = {};
      if (order.shipping_address_snapshot) {
        try {
          shippingAddr =
            typeof order.shipping_address_snapshot === 'string'
              ? JSON.parse(order.shipping_address_snapshot)
              : order.shipping_address_snapshot;
        } catch (e) {
          console.warn(`Failed to parse snapshot for order ${order.order_number}`);
        }
      }

      // Decrypt recipient info if possible (for backfill purposes)
      const recipientName =
        shippingAddr.name || shippingAddr.recipient_name || order.phone || 'Unknown';

      const safeDecrypt = (val: string | null) => {
        if (!val || val === '***' || val === '[encrypted]') return val;
        try {
          return decrypt(val);
        } catch {
          return val;
        }
      };

      const recipientPhone = safeDecrypt(
        shippingAddr.phone || order.phone_encrypted || order.phone
      );
      const addressLine = safeDecrypt(
        shippingAddr.address || shippingAddr.address_line || order.shipping_address_encrypted
      );

      await connection.execute(
        `INSERT IGNORE INTO order_shipping_details (order_id, recipient_name, recipient_phone, address_line, ward, district, city, country)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          recipientName,
          recipientPhone,
          addressLine,
          shippingAddr.ward || '',
          shippingAddr.district || '',
          shippingAddr.city || '',
          shippingAddr.country || 'Vietnam',
        ]
      );

      // ARC-02: Backfill order_payment_details
      await connection.execute(
        `INSERT IGNORE INTO order_payment_details (order_id, payment_method, payment_status, payment_confirmed_at)
         VALUES (?, ?, ?, ?)`,
        [
          order.id,
          order.payment_method || 'cod',
          order.payment_status || 'pending',
          order.payment_confirmed_at || null,
        ]
      );

      console.log(`[OK] Backfilled order ${order.order_number}`);
    }

    console.log('--- Orders Backfill Completed ---');
  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

backfillOrders();
