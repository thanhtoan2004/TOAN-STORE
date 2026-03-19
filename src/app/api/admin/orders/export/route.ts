import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable, users } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Xuất danh sách đơn hàng ra file CSV.
 * Chức năng:
 * - Truy vấn toàn bộ đơn hàng kèm thông tin khách hàng.
 * - Format dữ liệu sang định dạng CSV (Comma Separated Values).
 * - Sử dụng BOM UTF-8 (\ufeff) để Excel hiển thị đúng tiếng Việt.
 * - Trả về dưới dạng file download (attachment).
 * Bảo mật: Chỉ dành cho Admin.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const ordersData = await db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        customerName: sql<string>`CONCAT(COALESCE(${users.firstName}, ''), ' ', COALESCE(${users.lastName}, ''))`,
        customerEmail: users.email,
        total: ordersTable.total,
        status: ordersTable.status,
        paymentMethod: ordersTable.paymentMethod,
        placedAt: ordersTable.placedAt,
      })
      .from(ordersTable)
      .leftJoin(users, eq(ordersTable.userId, users.id))
      .orderBy(desc(ordersTable.placedAt));

    const csvHeaders = [
      'Order ID',
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Total',
      'Status',
      'Payment Method',
      'Placed At',
    ];

    const csvRows = [
      csvHeaders.join(','),
      ...ordersData.map((order) =>
        [
          order.id,
          `"${order.orderNumber || ''}"`,
          `"${(order.customerName || 'Guest').trim()}"`,
          `"${order.customerEmail || ''}"`,
          order.total,
          `"${order.status}"`,
          `"${order.paymentMethod || ''}"`,
          `"${order.placedAt ? new Date(order.placedAt).toLocaleString() : ''}"`,
        ].join(',')
      ),
    ];

    const csvContent = '\ufeff' + csvRows.join('\n');

    // Return raw CSV for successful file download
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="orders_export.csv"',
      },
    });
  } catch (error) {
    console.error('Order Export Error:', error);
    return ResponseWrapper.serverError('Lỗi server khi xuất file đơn hàng', error);
  }
}
