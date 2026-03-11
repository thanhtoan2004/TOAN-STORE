import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';

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
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      avatarUrl,
      email_notifications,
      sms_notifications,
      sms_order_notifications,
      push_notifications,
      promo_notifications,
      order_notifications,
      data_persistence,
      public_profile,
    } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName);
    }

    if (phone !== undefined) {
      updates.push(`phone = '***'`, 'phone_encrypted = ?', 'is_encrypted = TRUE');
      values.push(phone ? encrypt(phone) : null);
    }

    if (dateOfBirth !== undefined) {
      updates.push(`date_of_birth = '0001-01-01'`, 'date_of_birth_encrypted = ?');
      values.push(dateOfBirth ? encrypt(dateOfBirth) : null);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender || null);
    }
    if (avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatarUrl || null);
    }

    if (email_notifications !== undefined) {
      updates.push('email_notifications = ?');
      values.push(email_notifications ? 1 : 0);
    }
    if (sms_notifications !== undefined) {
      updates.push('sms_notifications = ?');
      values.push(sms_notifications ? 1 : 0);
    }
    if (sms_order_notifications !== undefined) {
      updates.push('sms_order_notifications = ?');
      values.push(sms_order_notifications ? 1 : 0);
    }
    if (push_notifications !== undefined) {
      updates.push('push_notifications = ?');
      values.push(push_notifications ? 1 : 0);
    }
    if (promo_notifications !== undefined) {
      updates.push('promo_notifications = ?');
      values.push(promo_notifications ? 1 : 0);
    }
    if (order_notifications !== undefined) {
      updates.push('order_notifications = ?');
      values.push(order_notifications ? 1 : 0);
    }
    if (data_persistence !== undefined) {
      updates.push('data_persistence = ?');
      values.push(data_persistence ? 1 : 0);
    }
    if (public_profile !== undefined) {
      updates.push('public_profile = ?');
      values.push(public_profile ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(session.userId);

      await executeQuery(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // Lấy thông tin đã cập nhật để trả về (đảm bảo frontend đồng bộ)
    const users = (await executeQuery(
      `SELECT id, email, email_encrypted, first_name, last_name, phone, phone_encrypted, is_encrypted,
              avatar_url, gender, date_of_birth, available_points, membership_tier
       FROM users WHERE id = ?`,
      [session.userId]
    )) as any[];

    const user = users[0];

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: user
        ? {
            id: user.id,
            email:
              user.is_encrypted && user.email_encrypted
                ? decrypt(user.email_encrypted)
                : user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone:
              user.is_encrypted && user.phone_encrypted
                ? decrypt(user.phone_encrypted)
                : user.phone,
            gender: user.gender,
            dateOfBirth: user.date_of_birth,
            avatarUrl: user.avatar_url,
            availablePoints: user.available_points || 0,
            membershipTier: user.membership_tier || 'bronze',
          }
        : null,
    });
  } catch (error) {
    console.error('Lỗi cập nhật thông tin:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra khi cập nhật thông tin' },
      { status: 500 }
    );
  }
}
