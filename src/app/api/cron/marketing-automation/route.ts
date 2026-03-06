import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { sendCustomerSurveyEmail, sendMonthlyDigestEmail } from '@/lib/email-templates';

/**
 * Cron Job: Marketing Automation.
 * Handles:
 * 1. Customer Satisfaction Surveys (3 days after delivery)
 * 2. Monthly Membership Digests (Loyalty Report)
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const task = searchParams.get('task');

    if (task === 'survey') {
      return await handleSurveys();
    } else if (task === 'digest') {
      return await handleMonthlyDigests();
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid task. Use task=survey or task=digest',
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[MARKETING_CRON] Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function handleSurveys() {
  // Find orders delivered exactly 3 days ago that haven't received a survey yet
  // We'll use a new field or just rely on status and delivered_at
  const results = await executeQuery<any[]>(`
        SELECT o.order_number, o.email, u.full_name as customer_name, o.id
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.status = 'delivered'
          AND o.delivered_at <= DATE_SUB(NOW(), INTERVAL 3 DAY)
          AND o.delivered_at > DATE_SUB(NOW(), INTERVAL 4 DAY)
          AND o.survey_sent = 0
    `);

  let sent = 0;
  for (const order of results) {
    try {
      await sendCustomerSurveyEmail(
        order.email,
        order.customer_name || 'Quý khách',
        order.order_number
      );
      await executeQuery('UPDATE orders SET survey_sent = 1 WHERE id = ?', [order.id]);
      sent++;
    } catch (err) {
      console.error(`Failed to send survey for ${order.order_number}:`, err);
    }
  }

  return NextResponse.json({ success: true, sent_count: sent });
}

async function handleMonthlyDigests() {
  // This would typically run once a month.
  // Logic: Find all users and calculate their savings/points for the last 30 days.
  const users = await executeQuery<any[]>(`
        SELECT id, email, full_name, membership_tier, available_points, lifetime_points
        FROM users
        WHERE is_active = 1 AND deleted_at IS NULL
    `);

  let sent = 0;
  for (const user of users) {
    // Mocking some values for savings for the demo
    // In a real app, query order history for the last 30 days
    const moneySaved = Math.floor(Math.random() * 500000) + 100000;
    const pointsNearExpiry =
      user.available_points > 1000 ? Math.floor(user.available_points * 0.1) : 0;

    try {
      await sendMonthlyDigestEmail(
        user.email,
        user.full_name || 'Quý khách',
        user.membership_tier || 'bronze',
        user.available_points || 0,
        moneySaved,
        pointsNearExpiry
      );
      sent++;
    } catch (err) {
      console.error(`Failed to send digest to ${user.email}:`, err);
    }
  }

  return NextResponse.json({ success: true, sent_count: sent });
}
