import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API Lịch sử giao dịch (Transaction History).
 * Điểm đặc biệt: Đây là API "Aggregation" (Tổng hợp) dữ liệu từ 4 bảng khác nhau:
 * 1. Thanh toán đơn hàng (orders)
 * 2. Hoàn tiền (refunds)
 * 3. Biến động điểm thưởng (point_transactions)
 * 4. Sử dụng thẻ quà tặng (gift_card_transactions)
 * Giúp người dùng có cái nhìn toàn cảnh về dòng tiền trong tài khoản của họ.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = Number(session.userId);
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
        const type = searchParams.get('type'); // 'payment' | 'refund' | 'points' | 'gift_card'
        const offset = (page - 1) * limit;

        // Build SQL UNION ALL với LIMIT/OFFSET thay vì fetch ALL rồi .slice()
        const unions: string[] = [];
        const countUnions: string[] = [];
        const params: any[] = [];
        const countParams: any[] = [];

        if (!type || type === 'payment') {
            unions.push(`
                SELECT o.id, o.order_number, o.total as amount, o.payment_method,
                       o.status as order_status, o.created_at,
                       'payment' as transaction_type,
                       CASE WHEN o.status IN ('delivered','processing','shipped') THEN 'completed'
                            WHEN o.status = 'cancelled' THEN 'cancelled'
                            WHEN o.status = 'pending' THEN 'pending'
                            ELSE o.status END as transaction_status,
                       NULL as description
                FROM orders o WHERE o.user_id = ?
            `);
            countUnions.push(`SELECT COUNT(*) as cnt FROM orders WHERE user_id = ?`);
            params.push(userId);
            countParams.push(userId);
        }

        if (!type || type === 'refund') {
            unions.push(`
                SELECT r.id, o.order_number, r.refund_amount as amount, o.payment_method,
                       o.status as order_status, r.created_at,
                       'refund' as transaction_type, r.status as transaction_status,
                       NULL as description
                FROM refunds r JOIN orders o ON r.order_id = o.id WHERE o.user_id = ?
            `);
            countUnions.push(`SELECT COUNT(*) as cnt FROM refunds r JOIN orders o ON r.order_id = o.id WHERE o.user_id = ?`);
            params.push(userId);
            countParams.push(userId);
        }

        if (!type || type === 'points') {
            unions.push(`
                SELECT pt.id, NULL as order_number, pt.points as amount, NULL as payment_method,
                       NULL as order_status, pt.created_at,
                       'points' as transaction_type, pt.type as transaction_status,
                       pt.description
                FROM point_transactions pt WHERE pt.user_id = ?
            `);
            countUnions.push(`SELECT COUNT(*) as cnt FROM point_transactions WHERE user_id = ?`);
            params.push(userId);
            countParams.push(userId);
        }

        if (!type || type === 'gift_card') {
            unions.push(`
                SELECT gct.id, gc.card_number as order_number, gct.amount, NULL as payment_method,
                       NULL as order_status, gct.created_at,
                       'gift_card' as transaction_type, gct.type as transaction_status,
                       gct.description
                FROM gift_card_transactions gct JOIN gift_cards gc ON gct.gift_card_id = gc.id
                WHERE gct.user_id = ?
            `);
            countUnions.push(`SELECT COUNT(*) as cnt FROM gift_card_transactions WHERE user_id = ?`);
            params.push(userId);
            countParams.push(userId);
        }

        if (unions.length === 0) {
            return NextResponse.json({ transactions: [], pagination: { page, limit, total: 0, totalPages: 0 } });
        }

        // Count total
        const countQuery = `SELECT SUM(cnt) as total FROM (${countUnions.join(' UNION ALL ')}) as counts`;
        const countResult = await executeQuery<any[]>(countQuery, countParams);
        const total = Number(countResult[0]?.total || 0);

        // Paginated data
        const dataQuery = `(${unions.join(') UNION ALL (')}) ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const transactions = await executeQuery<any[]>(dataQuery, params);

        return NextResponse.json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error: any) {
        console.error('Transaction history error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
