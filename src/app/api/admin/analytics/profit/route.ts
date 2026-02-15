import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';

export async function GET(request: Request) {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 30d, 7d, 24h

    let timeframe = 'INTERVAL 30 DAY';
    let grouping = '%Y-%m-%d';

    if (period === '7d') timeframe = 'INTERVAL 7 DAY';
    if (period === '24h') {
        timeframe = 'INTERVAL 24 HOUR';
        grouping = '%Y-%m-%d %H:00';
    }

    try {
        const profitStats = await executeQuery<any[]>(`
      SELECT 
        DATE_FORMAT(o.placed_at, '${grouping}') as date,
        SUM(o.total) as revenue,
        SUM(oi.total_cost) as total_cost,
        SUM(o.total - oi.total_cost) as net_profit
      FROM orders o
      JOIN (
        SELECT order_id, SUM(quantity * cost_price) as total_cost
        FROM order_items
        GROUP BY order_id
      ) oi ON o.id = oi.order_id
      WHERE o.placed_at >= DATE_SUB(NOW(), ${timeframe})
        AND o.status != 'cancelled'
      GROUP BY date
      ORDER BY date ASC
    `);

        // Calculate overall totals
        const totals = profitStats.reduce((acc, curr) => ({
            revenue: acc.revenue + parseFloat(curr.revenue),
            cost: acc.cost + parseFloat(curr.total_cost),
            profit: acc.profit + parseFloat(curr.net_profit)
        }), { revenue: 0, cost: 0, profit: 0 });

        return NextResponse.json({
            success: true,
            stats: profitStats,
            summary: {
                totalRevenue: totals.revenue,
                totalCost: totals.cost,
                netProfit: totals.profit,
                margin: totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0
            }
        });
    } catch (error) {
        console.error('Profit Analytics Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
