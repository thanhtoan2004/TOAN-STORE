import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users as usersTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { encrypt, decrypt } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Cập nhật thông tin cá nhân (Profile Update).
 * Bảo mật:
 * 1. Xác thực User qua Session.
 * 2. Số điện thoại (Phone) được mã hóa AES-256-GCM để bảo vệ quyền riêng tư (PII).
 * 3. Tự động ghi nhận thời gian update (updatedAt).
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
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

    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    if (phone !== undefined) {
      if (phone && !/^[0-9+()-\s]{10,15}$/.test(phone)) {
        return ResponseWrapper.error('Số điện thoại không hợp lệ', 400);
      }
      updateData.phone = '***';
      updateData.phoneEncrypted = phone ? encrypt(phone) : null;
      updateData.isEncrypted = 1;
    }

    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = null; // Corrected from legacy dummy date
      updateData.dateOfBirthEncrypted = dateOfBirth ? encrypt(dateOfBirth) : null;
      updateData.isEncrypted = 1;
    }

    if (gender !== undefined) updateData.gender = gender || null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;

    if (email_notifications !== undefined)
      updateData.emailNotifications = email_notifications ? 1 : 0;
    if (sms_notifications !== undefined) updateData.smsNotifications = sms_notifications ? 1 : 0;
    if (sms_order_notifications !== undefined)
      updateData.smsOrderNotifications = sms_order_notifications ? 1 : 0;
    if (push_notifications !== undefined) updateData.pushNotifications = push_notifications ? 1 : 0;
    if (promo_notifications !== undefined)
      updateData.promoNotifications = promo_notifications ? 1 : 0;
    if (order_notifications !== undefined)
      updateData.orderNotifications = order_notifications ? 1 : 0;
    if (data_persistence !== undefined) updateData.dataPersistence = data_persistence ? 1 : 0;
    if (public_profile !== undefined) updateData.publicProfile = public_profile ? 1 : 0;

    if (Object.keys(updateData).length > 0) {
      await db.update(usersTable).set(updateData).where(eq(usersTable.id, session.userId));
    }

    // Lấy thông tin đã cập nhật để trả về (đảm bảo frontend đồng bộ)
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);

    if (!user) {
      return ResponseWrapper.error('User not found', 404);
    }

    const responseData = {
      id: user.id,
      email: user.isEncrypted && user.emailEncrypted ? decrypt(user.emailEncrypted) : user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone:
        user.isEncrypted && user.phoneEncrypted
          ? decrypt(user.phoneEncrypted)
          : user.phone !== '***'
            ? user.phone
            : '',
      gender: user.gender,
      dateOfBirth:
        user.isEncrypted && user.dateOfBirthEncrypted
          ? decrypt(user.dateOfBirthEncrypted)
          : user.dateOfBirth,
      avatarUrl: user.avatarUrl,
      availablePoints: user.availablePoints || 0,
      membershipTier: user.membershipTier || 'bronze',
    };

    return ResponseWrapper.success(responseData, 'Cập nhật thông tin thành công');
  } catch (error) {
    console.error('Lỗi cập nhật thông tin:', error);
    return ResponseWrapper.serverError('Có lỗi xảy ra khi cập nhật thông tin', error);
  }
}
