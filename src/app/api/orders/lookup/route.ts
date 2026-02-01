
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
    try {
        const { orderNumber, email } = await request.json();

        if (!orderNumber || !email) {
            return NextResponse.json(
                { success: false, message: 'Vui lòng nhập Mã đơn hàng và Email' },
                { status: 400 }
            );
        }

        // Query order basic info
        const orders = await executeQuery(
            `SELECT * FROM orders 
       WHERE order_number = ? AND email = ? 
       LIMIT 1`,
            [orderNumber, email]
        ) as any[];

        if (orders.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy đơn hàng phù hợp' },
                { status: 404 }
            );
        }

        const order = orders[0];

        // Query order items
        const items = await executeQuery(
            `SELECT 
        oi.*,
        (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_main = 1 LIMIT 1) as image_url
       FROM order_items oi
       WHERE oi.order_id = ?`,
            [order.id]
        ) as any[];

        const orderDetails = {
            ...order,
            items: items
        };

        return NextResponse.json({
            success: true,
            order: orderDetails
        });

    } catch (error) {
        console.error('Order lookup error:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server nội bộ' },
            { status: 500 }
        );
    }
}
