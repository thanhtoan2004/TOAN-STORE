import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
    try {
        const orderNumber = 'NK1770198112101';

        // 1. Get raw order
        const [orders]: any = await pool.execute('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
        const order = orders[0];

        if (!order) {
            return NextResponse.json({ error: 'Order not found' });
        }

        // 2. Get associated address
        let address = null;
        if (order.shipping_address_id) {
            const [addresses]: any = await pool.execute('SELECT * FROM user_addresses WHERE id = ?', [order.shipping_address_id]);
            address = addresses[0];
        }

        // 3. Test the join query from getOrderByNumber
        const [joined]: any = await pool.execute(`
      SELECT 
      o.*,
      ua.recipient_name as delivery_name,
      ua.phone as delivery_phone,
      ua.address_line as delivery_address,
      ua.city as delivery_city,
      ua.state as delivery_district,
      ua.postal_code as delivery_postal_code
    FROM orders o
    LEFT JOIN user_addresses ua ON o.shipping_address_id = ua.id
    WHERE o.order_number = ?`, [orderNumber]);

        return NextResponse.json({
            raw_order: order,
            linked_address: address,
            joined_result: joined[0]
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack });
    }
}
