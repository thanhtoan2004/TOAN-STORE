import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

/**
 * API Lấy dữ liệu phân tích (Analytics) cho Dashboard.
 * Bao gồm: Tổng doanh thu, Đơn hàng theo trạng thái, Top sản phẩm bán chạy, 
 * Khách hàng mới và các sản phẩm sắp hết hàng.
 */
export async function GET(request: Request) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30'; // days

        const [
            [revenueData],
            ordersByStatus,
            revenueByDay,
            topProducts,
            [newCustomers],
            lowStock,
            categoryPerformance
        ]: any = await Promise.all([
            // 1. Total revenue
            query(`
                SELECT SUM(total) as total_revenue, COUNT(*) as total_orders, AVG(total) as avg_order_value
                FROM orders WHERE status IN ('completed', 'delivered') AND placed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [period]),
            // 2. Orders by status
            query(`
                SELECT status, COUNT(*) as count FROM orders WHERE placed_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY status
            `, [period]),
            // 3. Revenue by day
            query(`
                SELECT DATE(placed_at) as date, SUM(total) as revenue, COUNT(*) as orders
                FROM orders WHERE status IN ('completed', 'delivered') AND placed_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY DATE(placed_at) ORDER BY date ASC
            `, [period]),
            // 4. Top selling products
            query(`
                SELECT p.id, p.name, (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url,
                    SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price) as revenue
                FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id
                WHERE o.status IN ('completed', 'delivered') AND o.placed_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 10
            `, [period]),
            // 5. New customers
            query(`SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`, [period]),
            // 6. Low stock products
            query(`
                SELECT p.id, p.name, (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url, i.quantity, i.reserved
                FROM inventory i JOIN product_variants pv ON i.product_variant_id = pv.id JOIN products p ON pv.product_id = p.id
                WHERE i.quantity - i.reserved <= 10 ORDER BY (i.quantity - i.reserved) ASC LIMIT 10
            `),
            // 7. Category performance
            query(`
                SELECT c.name as category, COUNT(DISTINCT oi.order_id) as orders, SUM(oi.quantity) as items_sold, SUM(oi.quantity * oi.unit_price) as revenue
                FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN categories c ON p.category_id = c.id JOIN orders o ON oi.order_id = o.id
                WHERE o.status IN ('completed', 'delivered') AND o.placed_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY c.id, c.name ORDER BY revenue DESC LIMIT 10
            `, [period])
        ]);

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalRevenue: parseFloat(revenueData?.total_revenue || 0),
                    totalOrders: parseInt(revenueData?.total_orders || 0),
                    avgOrderValue: parseFloat(revenueData?.avg_order_value || 0),
                    newCustomers: parseInt(newCustomers?.count || 0)
                },
                ordersByStatus: ordersByStatus.map((item: any) => ({
                    status: item.status,
                    count: parseInt(item.count)
                })),
                revenueByDay: revenueByDay.map((item: any) => ({
                    date: item.date,
                    revenue: parseFloat(item.revenue),
                    orders: parseInt(item.orders)
                })),
                topProducts: topProducts.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    imageUrl: item.image_url,
                    totalSold: parseInt(item.total_sold),
                    revenue: parseFloat(item.revenue)
                })),
                lowStock: lowStock.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    imageUrl: item.image_url,
                    available: parseInt(item.quantity) - parseInt(item.reserved)
                })),
                categoryPerformance: categoryPerformance.map((item: any) => ({
                    category: item.category,
                    orders: parseInt(item.orders),
                    itemsSold: parseInt(item.items_sold),
                    revenue: parseFloat(item.revenue)
                }))
            }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch analytics'
        }, { status: 500 });
    }
}
