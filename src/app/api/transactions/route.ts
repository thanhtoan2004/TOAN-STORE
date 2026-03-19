import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth';
import { executeQuery } from '@/lib/db/mysql';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lịch sử giao dịch (Transaction History).
 * Sử dụng raw SQL để giải quyết triệt để lỗi TypeError của Drizzle unionAll.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const userId = Number(session.userId);
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const type = searchParams.get('type');
    const offset = (page - 1) * limit;
    console.log('[DEBUG] Fetching transactions for userId:', userId, 'type:', type);

    // Các phần của câu truy vấn UNION
    const queryParts: string[] = [];
    const params: any[] = [];

    // 1. Lọc theo loại (hoặc lấy tất cả)
    if (!type || type === 'payment') {
      queryParts.push(`
        SELECT 
          id, 
          order_number, 
          total as amount, 
          payment_method, 
          status as order_status, 
          placed_at as created_at, 
          'payment' as transaction_type, 
          CASE 
            WHEN status IN ('delivered','processing','shipped','payment_received','confirmed') THEN 'completed' 
            WHEN status = 'cancelled' THEN 'cancelled' 
            WHEN status IN ('pending','pending_payment_confirmation') THEN 'pending' 
            ELSE status 
          END as transaction_status, 
          NULL as description
        FROM orders 
        WHERE user_id = ?
      `);
      params.push(userId);
    }

    if (!type || type === 'refund') {
      queryParts.push(`
        SELECT 
          r.id, 
          o.order_number, 
          r.refund_amount as amount, 
          o.payment_method, 
          o.status as order_status, 
          r.created_at, 
          'refund' as transaction_type, 
          r.status as transaction_status, 
          r.reason as description
        FROM refunds r
        JOIN orders o ON r.order_id = o.id
        WHERE o.user_id = ?
      `);
      params.push(userId);
    }

    if (!type || type === 'points') {
      queryParts.push(`
        SELECT 
          id, 
          NULL as order_number, 
          points as amount, 
          NULL as payment_method, 
          NULL as order_status, 
          created_at, 
          'points' as transaction_type, 
          type as transaction_status, 
          description
        FROM point_transactions 
        WHERE user_id = ?
      `);
      params.push(userId);
    }

    if (!type || type === 'gift_card') {
      queryParts.push(`
        SELECT 
          gct.id, 
          gc.card_number_last4 as order_number, 
          gct.amount, 
          NULL as payment_method, 
          NULL as order_status, 
          gct.created_at, 
          'gift_card' as transaction_type, 
          'completed' as transaction_status, 
          gct.description
        FROM gift_card_transactions gct
        JOIN gift_cards gc ON gct.gift_card_id = gc.id
        WHERE gc.purchased_by = ?
      `);
      params.push(userId);
    }

    if (queryParts.length === 0) {
      return ResponseWrapper.success([], undefined, 200, { page, limit, total: 0, totalPages: 0 });
    }

    // 2. Tính tổng số lượng bản ghi
    const unionSql = queryParts.join(' UNION ALL ');
    const countSql = `SELECT COUNT(*) as total FROM (${unionSql}) as combined`;
    const countResult = await executeQuery<any[]>(countSql, params);
    const totalCount = Number(countResult[0]?.total || 0);
    console.log('[DEBUG] Transaction total count:', totalCount);

    // 3. Lấy dữ liệu phân trang
    const dataSql = `
      SELECT * FROM (${unionSql}) as combined 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const transactions = await executeQuery<any[]>(dataSql, dataParams);
    console.log('[DEBUG] Fetched transactions length:', transactions.length);

    return ResponseWrapper.success(transactions, 'Lấy lịch sử giao dịch thành công', 200, {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error: any) {
    console.error('Transaction history API error:', error);
    return ResponseWrapper.serverError('Internal Server Error', error);
  }
}
