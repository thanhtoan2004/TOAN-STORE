import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';

/**
 * API Cập nhật thông tin cá nhân (Profile Update).
 * Bảo mật:
 * 1. Xác thực User qua Session.
 * 2. Số điện thoại (Phone) được mã hóa AES-256-GCM để bảo vệ quyền riêng tư (PII).
 * 3. Tự động ghi nhận thời gian update (updated_at).
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      firstName, lastName, phone, dateOfBirth, gender, avatarUrl,
      email_notifications, sms_notifications, sms_order_notifications,
      push_notifications, promo_notifications, order_notifications,
      data_persistence, public_profile
    } = body;

    // Update user info
    await executeQuery(
      `UPDATE users 
       SET first_name = ?, 
           last_name = ?, 
           phone = ?, 
           date_of_birth = ?, 
           gender = ?,
           avatar_url = ?,
           email_notifications = ?,
           sms_notifications = ?,
           sms_order_notifications = ?,
           push_notifications = ?,
           promo_notifications = ?,
           order_notifications = ?,
           data_persistence = ?,
           public_profile = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        firstName,
        lastName,
        encrypt(phone || null),
        dateOfBirth || null,
        gender || null,
        avatarUrl || null,
        email_notifications !== undefined ? (email_notifications ? 1 : 0) : null,
        sms_notifications !== undefined ? (sms_notifications ? 1 : 0) : null,
        sms_order_notifications !== undefined ? (sms_order_notifications ? 1 : 0) : null,
        push_notifications !== undefined ? (push_notifications ? 1 : 0) : null,
        promo_notifications !== undefined ? (promo_notifications ? 1 : 0) : null,
        order_notifications !== undefined ? (order_notifications ? 1 : 0) : null,
        data_persistence !== undefined ? (data_persistence ? 1 : 0) : null,
        public_profile !== undefined ? (public_profile ? 1 : 0) : null,
        session.userId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin thành công'
    });
  } catch (error) {
    console.error('Lỗi cập nhật thông tin:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra khi cập nhật thông tin' },
      { status: 500 }
    );
  }
}
