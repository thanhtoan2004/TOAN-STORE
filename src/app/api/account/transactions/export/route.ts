import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET /api/account/transactions/export
 * Xuất lịch sử giao dịch của người dùng ra định dạng CSV.
 * Bao gồm: Mã đơn hàng, Ngày, Tổng tiền, Phương thức thanh toán, Trạng thái.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const transactions = await db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        placedAt: ordersTable.placedAt,
        total: ordersTable.total,
        paymentMethod: ordersTable.paymentMethod,
        paymentStatus: ordersTable.paymentStatus,
        status: ordersTable.status,
        shippingFee: ordersTable.shippingFee,
        discount: ordersTable.discount,
      })
      .from(ordersTable)
      .where(eq(ordersTable.userId, Number(session.userId)))
      .orderBy(desc(ordersTable.placedAt));

    // Build CSV
    const headers = [
      'Mã đơn hàng',
      'Ngày tạo',
      'Tổng tiền (VNĐ)',
      'Phí vận chuyển',
      'Giảm giá',
      'Phương thức TT',
      'TT Thanh toán',
      'Trạng thái',
    ];
    const rows = transactions.map((t) =>
      [
        t.orderNumber || `ORD-${t.id}`,
        t.placedAt ? new Date(t.placedAt).toLocaleString('vi-VN') : 'N/A',
        t.total,
        t.shippingFee || 0,
        t.discount || 0,
        t.paymentMethod || 'N/A',
        t.paymentStatus || 'N/A',
        t.status || 'N/A',
      ].join(',')
    );

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
    return ResponseWrapper.serverError('Lỗi server', error);
  }
}
