import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Fetch orders with user details
        const orders = await executeQuery<any[]>(`
      SELECT 
        o.id, 
        o.order_number, 
        CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as customer_name,
        u.email as customer_email,
        o.total, 
        o.status, 
        o.payment_method, 
        o.placed_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.placed_at DESC
    `);

        // Generate CSV content
        const headers = ['Order ID', 'Order Number', 'Customer Name', 'Customer Email', 'Total', 'Status', 'Payment Method', 'Placed At'];
        const csvRows = [
            headers.join(','),
            ...orders.map(order => [
                order.id,
                `"${order.order_number || ''}"`,
                `"${(order.customer_name || 'Guest').trim()}"`,
                `"${order.customer_email || ''}"`,
                order.total,
                `"${order.status}"`,
                `"${order.payment_method || ''}"`,
                `"${new Date(order.placed_at).toLocaleString()}"`
            ].join(','))
        ];

        const csvContent = "\ufeff" + csvRows.join('\n'); // Add BOM for UTF-8 support in Excel

        // Return as downloadable file
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="orders_export.csv"',
            },
        });
    } catch (error) {
        console.error('Order Export Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
