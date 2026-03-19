import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable, orderItems } from '@/lib/db/schema';
import { eq, ne, sql, and, gte, asc } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * API Phân tích Lợi nhuận (Profit Analytics).
 * Tính toán dựa trên:
 * - Doanh thu: Tổng tiền từ các đơn hàng không bị hủy.
 * - Giá vốn: Tổng `cost_price` từ các item trong đơn.
 * - Lợi nhuận ròng: Doanh thu - Giá vốn.
 * Hỗ trợ các mốc thời gian: 24h, 7 ngày, 30 ngày.
 */
export async function GET(request: Request) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d'; // 30d, 7d, 24h

  let timeframe = sql`INTERVAL 30 DAY`;
  let grouping = '%Y-%m-%d';

  if (period === '7d') timeframe = sql`INTERVAL 7 DAY`;
  if (period === '24h') {
    timeframe = sql`INTERVAL 24 HOUR`;
    grouping = '%Y-%m-%d %H:00';
  }

  try {
    // Subquery for order items cost
    const oiSub = db
      .select({
        orderId: orderItems.orderId,
        totalCost: sql<number>`SUM(${orderItems.quantity} * ${orderItems.costPrice})`.as(
          'total_cost'
        ),
      })
      .from(orderItems)
      .groupBy(orderItems.orderId)
      .as('oi');

    const profitStats = await db
      .select({
        date: sql<string>`DATE_FORMAT(${ordersTable.placedAt}, ${grouping})`.as('date'),
        revenue: sql<number>`SUM(${ordersTable.total})`.as('revenue'),
        totalCost: sql<number>`SUM(${oiSub.totalCost})`.as('total_cost'),
        netProfit: sql<number>`SUM(${ordersTable.total} - ${oiSub.totalCost})`.as('net_profit'),
      })
      .from(ordersTable)
      .innerJoin(oiSub, eq(ordersTable.id, oiSub.orderId))
      .where(
        and(
          gte(ordersTable.placedAt, sql`DATE_SUB(NOW(), ${timeframe})`),
          ne(ordersTable.status, 'cancelled')
        )
      )
      .groupBy(sql`date`)
      .orderBy(asc(sql`date`));

    // Calculate overall totals
    const totals = profitStats.reduce(
      (acc, curr) => ({
        revenue: acc.revenue + Number(curr.revenue),
        cost: acc.cost + Number(curr.totalCost),
        profit: acc.profit + Number(curr.netProfit),
      }),
      { revenue: 0, cost: 0, profit: 0 }
    );

    return NextResponse.json({
      success: true,
      stats: profitStats,
      summary: {
        totalRevenue: totals.revenue,
        totalCost: totals.cost,
        netProfit: totals.profit,
        margin: totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Profit Analytics Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
