import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { JWTPayload } from '@/types/auth';

// GET - Lấy thống kê dashboard
export async function GET(request: NextRequest) {
  try {
    // Kiểm tra auth từ cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify JWT và check admin
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as JWTPayload;

    // Check if user is admin
    const users = await executeQuery(
      'SELECT is_admin FROM users WHERE id = ?',
      [decoded.userId]
    ) as any[];

    if (users.length === 0 || users[0].is_admin !== 1) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get statistics
    const stats = await executeQuery<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM products WHERE is_active = 1) as total_products,
        (SELECT SUM(total) FROM orders WHERE status != 'cancelled') as total_revenue
    `);

    // Get recent orders
    const recentOrders = await executeQuery(`
      SELECT o.*, 
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.placed_at DESC
      LIMIT 10
    `);

    // Get top selling products
    const topProducts = await executeQuery(`
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

    return NextResponse.json({
      totalRevenue: parseFloat(stats[0]?.total_revenue) || 0,
      totalOrders: parseInt(stats[0]?.total_orders) || 0,
      totalProducts: parseInt(stats[0]?.total_products) || 0,
      totalUsers: parseInt(stats[0]?.total_users) || 0,
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
