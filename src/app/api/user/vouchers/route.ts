import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { vouchers as vouchersTable } from '@/lib/db/schema';
import { eq, and, sql, isNull, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy danh sách mã giảm giá cá nhân của người dùng.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return ResponseWrapper.unauthorized();
    }

    const vouchers = await db
      .select({
        code: vouchersTable.code,
        value: vouchersTable.value,
        discountType: vouchersTable.discountType,
        description: vouchersTable.description,
        validUntil: vouchersTable.validUntil,
        status: vouchersTable.status,
      })
      .from(vouchersTable)
      .where(
        and(
          eq(vouchersTable.recipientUserId, Number(auth.userId)),
          eq(vouchersTable.status, 'active'),
          sql`(${vouchersTable.validUntil} IS NULL OR ${vouchersTable.validUntil} > NOW())`,
          isNull(vouchersTable.deletedAt)
        )
      )
      .orderBy(desc(vouchersTable.createdAt));

    return ResponseWrapper.success(vouchers);
  } catch (error) {
    console.error('Error fetching user vouchers:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
