import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

/**
 * Get dashboard analytics
 * GET /api/admin/analytics
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30'; // days

        // Total revenue
        const [revenueData] = await query(
            `SELECT 
        SUM(total_amount) as total_revenue,
        COUNT(*) as total_orders,
        AVG(total_amount) as avg_order_value
       FROM orders
       WHERE status IN ('completed', 'delivered')
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [period]
        );

        // Orders by status
        const ordersByStatus = await query(
            `SELECT status, COUNT(*) as count
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY status`,
            [period]
        );

        // Revenue by day (last 30 days)
        const revenueByDay = await query(
            `SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
       FROM orders
       WHERE status IN ('completed', 'delivered')
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
            [period]
        );

        // Top selling products
        const topProducts = await query(
            `SELECT 
        p.id,
        p.name,
        p.image_url,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status IN ('completed', 'delivered')
         AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY p.id, p.name, p.image_url
       ORDER BY total_sold DESC
       LIMIT 10`,
            [period]
        );

        // New customers
        const [newCustomers] = await query(
            `SELECT COUNT(*) as count
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [period]
        );

        // Low stock products
        const lowStock = await query(
            `SELECT 
        p.id,
        p.name,
        p.image_url,
        i.quantity,
        i.reserved
       FROM inventory i
       JOIN product_variants pv ON i.product_variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE i.quantity - i.reserved <= 10
       ORDER BY (i.quantity - i.reserved) ASC
       LIMIT 10`
        );

        // Category performance
        const categoryPerformance = await query(
            `SELECT 
        c.name as category,
        COUNT(DISTINCT oi.order_id) as orders,
        SUM(oi.quantity) as items_sold,
        SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status IN ('completed', 'delivered')
         AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY c.id, c.name
       ORDER BY revenue DESC
       LIMIT 10`,
            [period]
        );

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
