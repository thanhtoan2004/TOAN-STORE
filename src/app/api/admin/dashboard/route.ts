import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

// GET - Comprehensive dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Basic statistics
    const basicStats = await executeQuery<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM products WHERE is_active = 1) as total_products,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
        (SELECT COALESCE(AVG(total), 0) FROM orders WHERE status = 'delivered') as average_order_value,
        (SELECT COUNT(*) FROM gift_cards WHERE status = 'active' AND current_balance > 0) as active_gift_cards
    `);

    // Revenue by status
    const revenueByStatus = await executeQuery<any[]>(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      GROUP BY status
    `);

    // Revenue trend (configurable days)
    const searchParams = new URL(request.url).searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    const revenueTrend = await executeQuery<any[]>(`
      SELECT 
        DATE(placed_at) as date,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as order_count
      FROM orders
      WHERE placed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(placed_at)
      ORDER BY date ASC
    `, [days]);

    // Financial metrics
    const financialStats = await executeQuery<any[]>(`
      SELECT 
        COALESCE(SUM(tax), 0) as total_vat,
        COALESCE(SUM(discount + voucher_discount + giftcard_discount), 0) as total_discounts,
        COALESCE(SUM(shipping_fee), 0) as total_shipping,
        COALESCE(SUM(subtotal) - SUM(discount + voucher_discount + giftcard_discount), 0) as net_revenue
      FROM orders
      WHERE status = 'delivered'
    `);

    // Inventory alerts
    const inventoryStats = await executeQuery<any[]>(`
      SELECT 
        (SELECT COUNT(DISTINCT pv.product_id) 
         FROM product_variants pv
         JOIN inventory i ON pv.id = i.product_variant_id
         WHERE (i.quantity - i.reserved) > 0 AND (i.quantity - i.reserved) < 10) as low_stock_count,
        (SELECT COUNT(DISTINCT pv.product_id) 
         FROM product_variants pv
         JOIN inventory i ON pv.id = i.product_variant_id
         WHERE (i.quantity - i.reserved) = 0) as out_of_stock_count
    `);

    // Low stock products
    const lowStockProducts = await executeQuery<any[]>(`
      SELECT 
        p.id,
        p.name,
        SUM(i.quantity - i.reserved) as total_quantity,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
      FROM inventory i
      JOIN product_variants pv ON i.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE (i.quantity - i.reserved) > 0 AND (i.quantity - i.reserved) < 10
      GROUP BY p.id, p.name
      ORDER BY total_quantity ASC
      LIMIT 5
    `);

    // Customer insights
    const customerStats = await executeQuery<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')) as new_customers_month,
        (SELECT COUNT(DISTINCT user_id) FROM orders WHERE user_id IN (
          SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 1
        )) as returning_customers
    `);

    // Top customers by spending
    const topCustomers = await executeQuery<any[]>(`
      SELECT 
        u.id,
        u.email,
        u.membership_tier,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        COALESCE(SUM(o.total), 0) as total_spent,
        COUNT(o.id) as order_count
      FROM users u
      JOIN orders o ON u.id = o.user_id
      WHERE o.status = 'delivered'
      GROUP BY u.id, u.email, u.membership_tier, u.first_name, u.last_name
      ORDER BY total_spent DESC
      LIMIT 5
    `);

    // Recent orders
    const recentOrders = await executeQuery<any[]>(`
      SELECT o.*, 
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.placed_at DESC
      LIMIT 10
    `);

    // Top selling products
    const topProducts = await executeQuery<any[]>(`
      SELECT 
        p.id,
        p.name,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as primary_image,
        p.base_price as price,
        SUM(oi.quantity) as sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id, p.name, p.base_price
      ORDER BY sold DESC
      LIMIT 10
    `);

    // Today vs Yesterday revenue
    const todayRevenue = await executeQuery<any[]>(`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE DATE(placed_at) = CURDATE()
    `);

    const yesterdayRevenue = await executeQuery<any[]>(`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE DATE(placed_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `);

    return NextResponse.json({
      // Basic stats
      totalRevenue: parseFloat(basicStats[0]?.total_revenue) || 0,
      totalOrders: parseInt(basicStats[0]?.total_orders) || 0,
      totalProducts: parseInt(basicStats[0]?.total_products) || 0,
      totalUsers: parseInt(basicStats[0]?.total_users) || 0,
      averageOrderValue: parseFloat(basicStats[0]?.average_order_value) || 0,
      activeGiftCards: parseInt(basicStats[0]?.active_gift_cards) || 0,

      // Revenue by status
      revenueByStatus: revenueByStatus.map(r => ({
        status: r.status,
        count: parseInt(r.count),
        revenue: parseFloat(r.revenue) || 0
      })),

      // Revenue trend
      revenueTrend: revenueTrend.map(r => ({
        date: r.date,
        revenue: parseFloat(r.revenue) || 0,
        orderCount: parseInt(r.order_count)
      })),

      // Financial metrics
      totalVAT: parseFloat(financialStats[0]?.total_vat) || 0,
      totalDiscounts: parseFloat(financialStats[0]?.total_discounts) || 0,
      totalShipping: parseFloat(financialStats[0]?.total_shipping) || 0,
      netRevenue: parseFloat(financialStats[0]?.net_revenue) || 0,

      // Inventory
      lowStockCount: parseInt(inventoryStats[0]?.low_stock_count) || 0,
      outOfStockCount: parseInt(inventoryStats[0]?.out_of_stock_count) || 0,
      lowStockProducts: lowStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        quantity: parseInt(p.total_quantity),
        image: p.image_url
      })),

      // Customer insights
      newCustomersMonth: parseInt(customerStats[0]?.new_customers_month) || 0,
      returningCustomers: parseInt(customerStats[0]?.returning_customers) || 0,
      topCustomers: topCustomers.map(c => ({
        id: c.id,
        email: c.email,
        name: c.full_name,
        membershipTier: c.membership_tier,
        totalSpent: parseFloat(c.total_spent) || 0,
        orderCount: parseInt(c.order_count)
      })),

      // Today vs Yesterday
      todayRevenue: parseFloat(todayRevenue[0]?.revenue) || 0,
      yesterdayRevenue: parseFloat(yesterdayRevenue[0]?.revenue) || 0,

      // Existing data
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
