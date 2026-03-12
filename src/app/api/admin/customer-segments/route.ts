import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
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

interface CustomerRFM {
  id: number;
  email: string;
  name: string;
  membership_tier: string;
  recency_days: number;
  frequency: number;
  monetary: number;
}

function classifySegment(r: number, f: number, m: number): string {
  if (r <= 30 && f >= 3 && m >= 5000000) return 'Champions';
  if (r <= 60 && f >= 2 && m >= 2000000) return 'Loyal';
  if (r <= 30 && f === 1) return 'New';
  if (r <= 90 && f >= 1 && m >= 1000000) return 'Potential';
  if (r > 90 && f >= 2) return 'At Risk';
  if (r > 180) return 'Lost';
  return 'Dormant';
}

// GET - Customer segmentation via RFM analysis
/**
 * API Phân đoạn khách hàng (Customer Segmentation) dựa trên mô hình RFM.
 * RFM là viết tắt của:
 * - Recency (R): Thời gian kể từ lần mua cuối cùng.
 * - Frequency (F): Tổng số đơn hàng đã thực hiện.
 * - Monetary (M): Tổng giá trị chi tiêu từ trước đến nay.
 * Kết quả giúp Admin nhận diện được các nhóm khách hàng: Champions (Vip), Loyal (Trung thành), New (Mới), At Risk (Nguy cơ rời bỏ), v.v.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // RFM query: Recency (days since last order), Frequency (order count), Monetary (total spent)
    const customers = await executeQuery<CustomerRFM[]>(`
      SELECT 
        u.id,
        u.email,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as name,
        u.membership_tier,
        DATEDIFF(NOW(), MAX(o.placed_at)) as recency_days,
        COUNT(o.id) as frequency,
        COALESCE(SUM(o.total), 0) as monetary
      FROM users u
      JOIN orders o ON u.id = o.user_id
      WHERE o.status NOT IN ('cancelled', 'refunded')
        AND u.deleted_at IS NULL
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.membership_tier
    `);

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
      const r = Number(c.recency_days) || 999;
      const f = Number(c.frequency) || 0;
      const m = Number(c.monetary) || 0;
      const segment = classifySegment(r, f, m);

      segmentMap[segment].count++;
      segmentMap[segment].revenue += m;
      segmentMap[segment].customers.push({
        id: c.id,
        email: c.email,
        name: c.name?.trim() || c.email,
        membershipTier: c.membership_tier,
        recencyDays: r,
        orderCount: f,
        totalSpent: m,
      });
    }

    // Sort customers within each segment by monetary value (highest first)
    for (const seg of Object.values(segmentMap)) {
      seg.customers.sort((a: any, b: any) => b.totalSpent - a.totalSpent);
      // Limit to top 10 per segment for response size
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
    const avgOrderValue =
      totalCustomers > 0
        ? totalRevenue / customers.reduce((sum, c) => sum + Number(c.frequency), 0)
        : 0;

    // Membership tier distribution
    const tierDistribution = await executeQuery<any[]>(`
      SELECT 
        membership_tier as tier,
        COUNT(*) as count
      FROM users
      WHERE deleted_at IS NULL
      GROUP BY membership_tier
      ORDER BY FIELD(membership_tier, 'platinum', 'gold', 'silver', 'bronze')
    `);

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
