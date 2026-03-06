import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';
import { formatDateTime } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.userId);

    // Fetch all transactions from all sources
    const transactions: any[] = [];

    // 1. Order payments
    const orderPayments = await executeQuery<any[]>(
      `
            SELECT 
                o.order_number,
                o.total as amount,
                o.payment_method,
                o.status as order_status,
                o.placed_at as created_at,
                'payment' as transaction_type,
                o.status as transaction_status
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.placed_at DESC
        `,
      [userId]
    );
    transactions.push(...orderPayments);

    // 2. Refunds
    const refunds = await executeQuery<any[]>(
      `
            SELECT 
                o.order_number,
                r.refund_amount as amount,
                o.payment_method,
                o.status as order_status,
                r.created_at,
                'refund' as transaction_type,
                r.status as transaction_status
            FROM refunds r
            JOIN orders o ON r.order_id = o.id
            WHERE o.user_id = ?
            ORDER BY r.created_at DESC
        `,
      [userId]
    );
    transactions.push(...refunds);

    // 3. Points transactions
    const points = await executeQuery<any[]>(
      `
            SELECT 
                NULL as order_number,
                pt.points as amount,
                NULL as payment_method,
                NULL as order_status,
                pt.created_at,
                'points' as transaction_type,
                pt.type as transaction_status,
                pt.description
            FROM point_transactions pt
            WHERE pt.user_id = ?
            ORDER BY pt.created_at DESC
        `,
      [userId]
    );
    transactions.push(...points);

    // 4. Gift card transactions
    const giftCards = await executeQuery<any[]>(
      `
            SELECT 
                gc.card_number as order_number,
                gct.amount,
                NULL as payment_method,
                NULL as order_status,
                gct.created_at,
                'gift_card' as transaction_type,
                'completed' as transaction_status
            FROM gift_card_transactions gct
            JOIN gift_cards gc ON gct.gift_card_id = gc.id
            WHERE gc.purchased_by = ?
            ORDER BY gct.created_at DESC
        `,
      [userId]
    );
    transactions.push(...giftCards);

    // Sort all by date
    transactions.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Generate CSV
    const headers = [
      'Date',
      'Type',
      'Amount',
      'Status',
      'Order/Card Number',
      'Payment Method',
      'Description',
    ];
    const csvRows = [headers.join(',')];

    for (const tx of transactions) {
      const row = [
        `"${formatDateTime(tx.created_at)}"`,
        `"${tx.transaction_type}"`,
        `"${tx.amount}"`,
        `"${tx.transaction_status}"`,
        `"${tx.order_number || ''}"`,
        `"${tx.payment_method || ''}"`,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transactions_${userId}_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
