import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth';
import { executeQuery } from '@/lib/db/mysql';
import { pool } from '@/lib/db/connection';

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

/**
 * GET - Lấy danh sách voucher có thể đổi điểm.
 *
 * Quy tắc lọc:
 * - Chỉ hiển thị voucher chưa có người nhận (recipient_user_id IS NULL).
 * - Còn hạn sử dụng (valid_until > NOW() hoặc không giới hạn thời gian).
 * - Trạng thái đang hoạt động (status = 'active') và chưa bị xóa mềm.
 *
 * Công thức quy đổi điểm:
 * - Voucher giảm theo % => điểm = giá_trị * 10  (VD: giảm 10% = 100 điểm)
 * - Voucher giảm cố định => điểm = giá_trị / 1000 (VD: giảm 50.000₫ = 50 điểm)
 */
export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Lấy điểm tích lũy hiện tại từ bảng users
    const [userData] = (await executeQuery(
      'SELECT available_points FROM users WHERE id = ? AND is_banned = 0 AND deleted_at IS NULL',
      [user.userId]
    )) as any[];

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'Tài khoản không hợp lệ' },
        { status: 403 }
      );
    }

    const currentPoints = userData.available_points || 0;

    // Lấy danh sách voucher khả dụng, sắp xếp theo giá trị tăng dần
    const vouchers = (await executeQuery(`
      SELECT 
        id, code, value, discount_type, description, 
        valid_from, valid_until,
        CASE 
          WHEN discount_type = 'percent' THEN FLOOR(value * 10)
          ELSE FLOOR(value / 1000)
        END as points_required
      FROM vouchers
      WHERE recipient_user_id IS NULL
        AND status = 'active'
        AND deleted_at IS NULL
        AND (valid_until IS NULL OR valid_until > NOW())
      ORDER BY 
        CASE WHEN discount_type = 'percent' THEN FLOOR(value * 10) ELSE FLOOR(value / 1000) END ASC
    `)) as any[];

    return NextResponse.json({
      success: true,
      data: { currentPoints, vouchers },
    });
  } catch (error) {
    console.error('[Redeem GET] Lỗi khi tải danh sách voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}

/**
 * POST - Đổi điểm lấy voucher.
 *
 * Quy trình xử lý (trong Transaction):
 * 1. Validate: Kiểm tra voucherId hợp lệ (số nguyên dương).
 * 2. Lock: SELECT ... FOR UPDATE trên bảng users + vouchers để ngăn Race Condition.
 * 3. Check: Kiểm tra user có đủ điểm, voucher còn khả dụng.
 * 4. Execute: Trừ điểm → Ghi log point_transactions → Gán voucher cho user.
 * 5. Commit hoặc Rollback nếu có lỗi.
 *
 * Bảo mật chống Race Condition:
 * - Nếu 2 request đồng thời gửi cùng voucherId, chỉ 1 request thành công
 *   nhờ cơ chế khóa hàng (Row Lock) của InnoDB Transaction.
 */
export async function POST(request: NextRequest) {
  // Lấy connection riêng từ pool để dùng transaction
  const connection = await pool.getConnection();

  try {
    const user = await verifyAuth();
    if (!user) {
      connection.release();
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const voucherId = Number(body.voucherId);

    // Validate đầu vào: phải là số nguyên dương
    if (!voucherId || !Number.isInteger(voucherId) || voucherId <= 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: 'Voucher ID không hợp lệ' },
        { status: 400 }
      );
    }

    // Bắt đầu Transaction
    await connection.beginTransaction();

    try {
      // Khóa hàng user để tránh trừ điểm đồng thời (Race Condition)
      const [userRows] = (await connection.query(
        'SELECT available_points FROM users WHERE id = ? AND is_banned = 0 AND deleted_at IS NULL FOR UPDATE',
        [user.userId]
      )) as any;

      if (!userRows || userRows.length === 0) {
        await connection.rollback();
        connection.release();
        return NextResponse.json(
          { success: false, message: 'Tài khoản không hợp lệ' },
          { status: 403 }
        );
      }

      const currentPoints = userRows[0].available_points || 0;

      // Khóa hàng voucher để tránh 2 người đổi cùng lúc
      const [voucherRows] = (await connection.query(
        `SELECT id, code, value, discount_type, description,
          CASE 
            WHEN discount_type = 'percent' THEN FLOOR(value * 10)
            ELSE FLOOR(value / 1000)
          END as points_required
         FROM vouchers
         WHERE id = ? AND recipient_user_id IS NULL AND status = 'active' AND deleted_at IS NULL
           AND (valid_until IS NULL OR valid_until > NOW())
         FOR UPDATE`,
        [voucherId]
      )) as any;

      if (!voucherRows || voucherRows.length === 0) {
        await connection.rollback();
        connection.release();
        return NextResponse.json(
          { success: false, message: 'Voucher không khả dụng hoặc đã được người khác nhận' },
          { status: 400 }
        );
      }

      const voucher = voucherRows[0];
      const pointsRequired = voucher.points_required;

      // Kiểm tra đủ điểm
      if (currentPoints < pointsRequired) {
        await connection.rollback();
        connection.release();
        return NextResponse.json(
          {
            success: false,
            message: `Bạn cần ${pointsRequired} điểm nhưng chỉ có ${currentPoints} điểm`,
          },
          { status: 400 }
        );
      }

      // === THỰC HIỆN GIAO DỊCH ===

      const newPoints = currentPoints - pointsRequired;

      // Bước 1: Trừ điểm và không đụng vào hạng thành viên
      await connection.query('UPDATE users SET available_points = ? WHERE id = ?', [
        newPoints,
        user.userId,
      ]);

      // Bước 2: Ghi nhận lịch sử giao dịch điểm chuẩn Production
      await connection.query(
        `INSERT INTO point_transactions (user_id, points, type, balance_after, source, source_id, description, created_at)
         VALUES (?, ?, 'redeem', ?, 'voucher', ?, ?, NOW())`,
        [user.userId, -pointsRequired, newPoints, String(voucherId), `Đổi voucher: ${voucher.code}`]
      );

      // Bước 3: Gán voucher cho người dùng
      await connection.query(
        'UPDATE vouchers SET recipient_user_id = ?, updated_at = NOW() WHERE id = ?',
        [user.userId, voucherId]
      );

      // Commit Transaction - tất cả hoặc không có gì
      await connection.commit();
      connection.release();

      return NextResponse.json({
        success: true,
        message: `Đổi thành công voucher ${voucher.code}! Đã trừ ${pointsRequired} điểm.`,
        data: {
          voucherCode: voucher.code,
          pointsSpent: pointsRequired,
          remainingPoints: currentPoints - pointsRequired,
        },
      });
    } catch (txError) {
      // Rollback nếu có lỗi trong quá trình giao dịch
      await connection.rollback();
      throw txError;
    }
  } catch (error) {
    connection.release();
    console.error('[Redeem POST] Lỗi khi đổi voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}
