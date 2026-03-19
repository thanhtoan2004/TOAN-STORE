import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth';
import { db } from '@/lib/db/drizzle';
import { users as usersTable, vouchers as vouchersTable, pointTransactions } from '@/lib/db/schema';
import { eq, and, isNull, or, gt, sql, asc } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Đổi Điểm Thưởng Lấy Voucher
 *
 * Bảo mật:
 * - Yêu cầu xác thực người dùng qua JWT (verifyAuth).
 * - Sử dụng Database Transaction + SELECT FOR UPDATE để ngăn chặn Race Condition
 *   (tránh trường hợp 2 request đồng thời trừ điểm 2 lần).
 * - Kiểm tra trạng thái voucher trước khi gán (tránh voucher đã bị nhận bởi user khác).
 * - Validate đầu vào: kiểm tra voucherId là số nguyên dương.
 */

// Custom SQL for points required calculation
const pointsRequiredSql = sql<number>`
  CASE 
    WHEN ${vouchersTable.discountType} = 'percent' THEN FLOOR(${vouchersTable.value} * 10)
    ELSE FLOOR(${vouchersTable.value} / 1000)
  END
`;

/**
 * GET - Lấy danh sách voucher có thể đổi điểm.
 *
 * Quy tắc lọc:
 * - Chỉ hiển thị voucher chưa có người nhận (recipient_user_id IS NULL).
 * - Còn hạn sử dụng (valid_until > NOW() hoặc không giới hạn thời gian).
 * - Trạng thái đang hoạt động (status = 'active') và chưa bị xóa mềm.
 */
export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) {
      return ResponseWrapper.unauthorized();
    }

    // 1. Get current available points
    const [userData] = await db
      .select({ availablePoints: usersTable.availablePoints })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, user.userId),
          eq(usersTable.isBanned, 0),
          isNull(usersTable.deletedAt)
        )
      )
      .limit(1);

    if (!userData) {
      return ResponseWrapper.forbidden('Tài khoản không hợp lệ');
    }

    const currentPoints = userData.availablePoints || 0;

    // 2. Get list of available vouchers
    const vouchers = await db
      .select({
        id: vouchersTable.id,
        code: vouchersTable.code,
        value: vouchersTable.value,
        discountType: vouchersTable.discountType,
        description: vouchersTable.description,
        validFrom: vouchersTable.validFrom,
        validUntil: vouchersTable.validUntil,
        pointsRequired: pointsRequiredSql,
      })
      .from(vouchersTable)
      .where(
        and(
          isNull(vouchersTable.recipientUserId),
          eq(vouchersTable.status, 'active'),
          isNull(vouchersTable.deletedAt),
          or(isNull(vouchersTable.validUntil), gt(vouchersTable.validUntil, new Date()))
        )
      )
      .orderBy(asc(pointsRequiredSql));

    return ResponseWrapper.success({ currentPoints, vouchers });
  } catch (error) {
    console.error('[Redeem GET] Lỗi khi tải danh sách voucher:', error);
    return ResponseWrapper.serverError('Lỗi hệ thống, vui lòng thử lại sau', error);
  }
}

/**
 * POST - Đổi điểm lấy voucher.
 *
 * Bảo mật chống Race Condition:
 * - Transaction + Row Lock (forUpdate) đảm bảo tính toàn vẹn dữ liệu.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const voucherId = Number(body.voucherId);

    // Validate input
    if (!voucherId || !Number.isInteger(voucherId) || voucherId <= 0) {
      return ResponseWrapper.error('Voucher ID không hợp lệ', 400);
    }

    return await db.transaction(async (tx) => {
      // 1. Lock user row to prevent concurrent points deduction
      const [userRow] = await (
        tx
          .select({ availablePoints: usersTable.availablePoints })
          .from(usersTable)
          .where(
            and(
              eq(usersTable.id, user.userId),
              eq(usersTable.isBanned, 0),
              isNull(usersTable.deletedAt)
            )
          ) as any
      ).forUpdate();

      if (!userRow) {
        return ResponseWrapper.forbidden('Tài khoản không hợp lệ');
      }

      const currentPoints = userRow.availablePoints || 0;

      // 2. Lock voucher row to prevent concurrent redemption
      const [voucher] = await (
        tx
          .select({
            id: vouchersTable.id,
            code: vouchersTable.code,
            pointsRequired: pointsRequiredSql,
          })
          .from(vouchersTable)
          .where(
            and(
              eq(vouchersTable.id, voucherId),
              isNull(vouchersTable.recipientUserId),
              eq(vouchersTable.status, 'active'),
              isNull(vouchersTable.deletedAt),
              or(isNull(vouchersTable.validUntil), gt(vouchersTable.validUntil, new Date()))
            )
          ) as any
      ).forUpdate();

      if (!voucher) {
        return ResponseWrapper.error('Voucher không khả dụng hoặc đã được người khác nhận', 400);
      }

      const pointsRequired = Number(voucher.pointsRequired);

      // Check if user has enough points
      if (currentPoints < pointsRequired) {
        return ResponseWrapper.error(
          `Bạn cần ${pointsRequired} điểm nhưng chỉ có ${currentPoints} điểm`,
          400
        );
      }

      // === EXECUTE TRANSACTION ===
      const newPoints = currentPoints - pointsRequired;

      // 1. Update user points
      await tx
        .update(usersTable)
        .set({ availablePoints: newPoints })
        .where(eq(usersTable.id, user.userId));

      // 2. Log point transaction
      await tx.insert(pointTransactions).values({
        userId: user.userId,
        points: -pointsRequired,
        type: 'redeem',
        balanceAfter: newPoints,
        source: 'voucher',
        sourceId: String(voucherId),
        description: `Đổi voucher: ${voucher.code}`,
      });

      // 3. Assign voucher to user
      await tx
        .update(vouchersTable)
        .set({ recipientUserId: user.userId })
        .where(eq(vouchersTable.id, voucherId));

      return ResponseWrapper.success(
        {
          voucherCode: voucher.code,
          pointsSpent: pointsRequired,
          remainingPoints: newPoints,
        },
        `Đổi thành công voucher ${voucher.code}! Đã trừ ${pointsRequired} điểm.`
      );
    });
  } catch (error) {
    console.error('[Redeem POST] Lỗi khi đổi voucher:', error);
    return ResponseWrapper.serverError('Lỗi hệ thống, vui lòng thử lại sau', error);
  }
}
