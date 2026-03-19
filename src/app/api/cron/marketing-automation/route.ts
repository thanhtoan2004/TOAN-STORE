import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable, users as usersTable } from '@/lib/db/schema';
import { eq, and, sql, isNull, gt, lt } from 'drizzle-orm';
import { sendCustomerSurveyEmail, sendMonthlyDigestEmail } from '@/lib/mail/email-templates';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Cron Job: Marketing Automation.
 * Handles:
 * 1. Customer Satisfaction Surveys (3 days after delivery)
 * 2. Monthly Membership Digests (Loyalty Report)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return ResponseWrapper.unauthorized('Invalid authorization or server environment');
    }

    const { searchParams } = new URL(request.url);
    const task = searchParams.get('task');

    if (task === 'survey') {
      return await handleSurveys();
    } else if (task === 'digest') {
      return await handleMonthlyDigests();
    }

    return ResponseWrapper.error('Invalid task. Use task=survey or task=digest', 400);
  } catch (error: any) {
    console.error('[MARKETING_CRON] Error:', error);
    return ResponseWrapper.serverError(error.message || 'Cron execution failed', error);
  }
}

async function handleSurveys() {
  // Find orders delivered exactly 3 days ago that haven't received a survey yet
  const results = await db
    .select({
      orderNumber: ordersTable.orderNumber,
      email: ordersTable.email,
      customerName: usersTable.fullName,
      id: ordersTable.id,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(
      and(
        eq(ordersTable.status, 'delivered'),
        lt(ordersTable.deliveredAt, sql`DATE_SUB(NOW(), INTERVAL 3 DAY)`),
        gt(ordersTable.deliveredAt, sql`DATE_SUB(NOW(), INTERVAL 4 DAY)`),
        eq(ordersTable.surveySent, 0)
      )
    );

  let sent = 0;
  for (const order of results) {
    try {
      if (order.email) {
        await sendCustomerSurveyEmail(
          order.email,
          order.customerName || 'Quý khách',
          order.orderNumber
        );
        await db.update(ordersTable).set({ surveySent: 1 }).where(eq(ordersTable.id, order.id));
        sent++;
      }
    } catch (err) {
      console.error(`Failed to send survey for ${order.orderNumber}:`, err);
    }
  }

  return ResponseWrapper.success({ sent_count: sent }, 'Customer surveys processed');
}

async function handleMonthlyDigests() {
  // Find all users and calculate their savings/points for the last 30 days.
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      fullName: usersTable.fullName,
      membershipTier: usersTable.membershipTier,
      availablePoints: usersTable.availablePoints,
      lifetimePoints: usersTable.lifetimePoints,
    })
    .from(usersTable)
    .where(and(eq(usersTable.isActive, 1), isNull(usersTable.deletedAt)));

  let sent = 0;
  for (const user of users) {
    // Calculate REAL savings for the last 30 days
    const [savingsResult] = await db
      .select({
        totalSaved: sql<number>`SUM(CAST(${ordersTable.voucherDiscount} AS DECIMAL(15,2)) + CAST(${ordersTable.giftcardDiscount} AS DECIMAL(15,2)))`,
      })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.userId, user.id),
          gt(ordersTable.placedAt, sql`DATE_SUB(NOW(), INTERVAL 30 DAY)`),
          isNull(ordersTable.cancelledAt)
        )
      );

    const moneySaved = Number(savingsResult?.totalSaved || 0);
    const pointsNearExpiry =
      (user.availablePoints || 0) > 1000 ? Math.floor((user.availablePoints || 0) * 0.1) : 0;

    try {
      if (user.email) {
        await sendMonthlyDigestEmail(
          user.email,
          user.fullName || 'Quý khách',
          user.membershipTier || 'bronze',
          user.availablePoints || 0,
          moneySaved,
          pointsNearExpiry
        );
        sent++;
      }
    } catch (err) {
      console.error(`Failed to send digest to ${user.email}:`, err);
    }
  }

  return ResponseWrapper.success({ sent_count: sent }, 'Monthly membership digests processed');
}
