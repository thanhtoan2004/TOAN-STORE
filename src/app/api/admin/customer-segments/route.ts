import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, orders as ordersTable } from '@/lib/db/schema';
import { eq, ne, gte, sql, desc, count, sum, and, isNull, inArray } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * RFM Segmentation Rules:
 * - Champions:     R ≤ 30 days, F ≥ 3, M ≥ 5,000,000
 * - Loyal:         R ≤ 60 days, F ≥ 2, M ≥ 2,000,000
 * - Potential:     R ≤ 90 days, F = 1, M ≥ 1,000,000
 * - At Risk:       R > 90 days, F ≥ 2
 * - New:           R ≤ 30 days, F = 1
 * - Lost:          R > 180 days
 * - Dormant:       Everything else
 */

function classifySegment(r: number, f: number, m: number): string {
  if (r <= 30 && f >= 3 && m >= 5000000) return 'Champions';
  if (r <= 60 && f >= 2 && m >= 2000000) return 'Loyal';
  if (r <= 30 && f === 1) return 'New';
  if (r <= 90 && f >= 1 && m >= 1000000) return 'Potential';
  if (r > 90 && f >= 2) return 'At Risk';
  if (r > 180) return 'Lost';
  return 'Dormant';
}

/**
 * API Phân đoạn khách hàng (Customer Segmentation) dựa trên mô hình RFM.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const [customers, tierDistribution] = await Promise.all([
      // RFM query
      db
        .select({
          id: users.id,
          email: users.email,
          name: sql<string>`CONCAT(COALESCE(${users.firstName}, ''), ' ', COALESCE(${users.lastName}, ''))`,
          membershipTier: users.membershipTier,
          recencyDays: sql<number>`DATEDIFF(NOW(), MAX(${ordersTable.placedAt}))`,
          frequency: count(ordersTable.id),
          monetary: sql<number>`COALESCE(SUM(${ordersTable.total}), 0)`,
        })
        .from(users)
        .innerJoin(ordersTable, eq(users.id, ordersTable.userId))
        .where(
          and(notInArray(ordersTable.status, ['cancelled', 'refunded']), isNull(users.deletedAt))
        )
        .groupBy(users.id),

      // Membership tier distribution
      db
        .select({
          tier: users.membershipTier,
          count: count(),
        })
        .from(users)
        .where(isNull(users.deletedAt))
        .groupBy(users.membershipTier)
        .orderBy(sql`FIELD(${users.membershipTier}, 'platinum', 'gold', 'silver', 'bronze')`),
    ]);

    // Classify each customer
    const segmentMap: Record<string, { count: number; revenue: number; customers: any[] }> = {
      Champions: { count: 0, revenue: 0, customers: [] },
      Loyal: { count: 0, revenue: 0, customers: [] },
      Potential: { count: 0, revenue: 0, customers: [] },
      New: { count: 0, revenue: 0, customers: [] },
      'At Risk': { count: 0, revenue: 0, customers: [] },
      Lost: { count: 0, revenue: 0, customers: [] },
      Dormant: { count: 0, revenue: 0, customers: [] },
    };

    for (const c of customers) {
      const r = Number(c.recencyDays) || 999;
      const f = Number(c.frequency) || 0;
      const m = Number(c.monetary) || 0;
      const segment = classifySegment(r, f, m);

      segmentMap[segment].count++;
      segmentMap[segment].revenue += m;
      segmentMap[segment].customers.push({
        id: c.id,
        email: c.email,
        name: c.name?.trim() || c.email,
        membershipTier: c.membershipTier,
        recencyDays: r,
        orderCount: f,
        totalSpent: m,
      });
    }

    // Sort and limit
    for (const seg of Object.values(segmentMap)) {
      seg.customers.sort((a: any, b: any) => b.totalSpent - a.totalSpent);
      seg.customers = seg.customers.slice(0, 10);
    }

    const segments = Object.entries(segmentMap).map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      customers: data.customers,
    }));

    // Overall stats
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + Number(c.monetary), 0);
    const totalOrdersCount = customers.reduce((sum, c) => sum + Number(c.frequency), 0);
    const avgOrderValue = totalCustomers > 0 ? totalRevenue / totalOrdersCount : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          totalRevenue,
          avgOrderValue: Math.round(avgOrderValue),
          tierDistribution,
        },
        segments,
      },
    });
  } catch (error) {
    console.error('Customer segmentation error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// Helper to handle notInArray
function notInArray(column: any, values: string[]) {
  return sql`${column} NOT IN (${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `
  )})`;
}
