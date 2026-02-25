import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';
import { decrypt } from '@/lib/encryption';

/**
 * GET /api/account/transactions/export
 * Xuất lịch sử giao dịch của người dùng ra định dạng CSV.
 * Bao gồm: Mã đơn hàng, Ngày, Tổng tiền, Phương thức thanh toán, Trạng thái.
 */
export async function GET(req: NextRequest) {
    const session = await verifyAuth();
    if (!session) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const transactions = await executeQuery(
            `SELECT 
                o.id, o.order_number, o.created_at, o.total_amount, 
                o.payment_method, o.payment_status, o.status,
                o.shipping_fee, o.discount_amount
             FROM orders o
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC`,
            [session.userId]
        ) as any[];

        // Build CSV
        const headers = ['Mã đơn hàng', 'Ngày tạo', 'Tổng tiền (VNĐ)', 'Phí vận chuyển', 'Giảm giá', 'Phương thức TT', 'TT Thanh toán', 'Trạng thái'];
        const rows = transactions.map((t: any) => [
            t.order_number || `ORD-${t.id}`,
            new Date(t.created_at).toLocaleString('vi-VN'),
            t.total_amount,
            t.shipping_fee || 0,
            t.discount_amount || 0,
            t.payment_method || 'N/A',
            t.payment_status || 'N/A',
            t.status || 'N/A',
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel

        return new NextResponse(BOM + csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch (error) {
        console.error('Transaction export error:', error);
        return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
    }
}
