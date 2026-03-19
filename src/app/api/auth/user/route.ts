import { db } from '@/lib/db/drizzle';
import { users as usersTable } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { decrypt } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy thông tin cá nhân của người dùng hiện tại.
 * Dữ liệu bao gồm: Profile, Điểm tích lũy, Hạng thành viên và trạng thái 2FA.
 * Tự động giải mã số điện thoại (PII) trước khi trả về frontend.
 */
export async function GET() {
  try {
    const session = await verifyAuth();

    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    // Lấy thông tin người dùng từ CSDL sử dụng Drizzle ORM
    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, session.userId), isNull(usersTable.deletedAt)))
      .limit(1);

    if (!user) {
      return ResponseWrapper.error('Không tìm thấy người dùng', 404);
    }

    // Giải mã Email if encrypted
    const decryptedEmail =
      user.isEncrypted && user.emailEncrypted
        ? decrypt(user.emailEncrypted)
        : user.email !== '***'
          ? user.email
          : '';

    // Giải mã SĐT: Nếu is_encrypted=true thì decrypt cột phone_encrypted, không thì lấy phone gốc
    const decryptedPhone =
      user.isEncrypted && user.phoneEncrypted
        ? decrypt(user.phoneEncrypted)
        : user.phone !== '***'
          ? user.phone
          : '';

    // Giải mã Ngày sinh: Handle both encrypted and raw formats
    const decryptedDOB =
      user.isEncrypted && user.dateOfBirthEncrypted
        ? decrypt(user.dateOfBirthEncrypted)
        : user.dateOfBirth;

    return ResponseWrapper.success({
      user: {
        id: user.id,
        email: decryptedEmail,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: decryptedPhone,
        dateOfBirth: decryptedDOB,
        gender: user.gender,
        isActive: !!user.isActive,
        isVerified: !!user.isVerified,
        availablePoints: user.availablePoints || 0,
        lifetimePoints: user.lifetimePoints || 0,
        membershipTier: user.membershipTier || 'bronze',
        two_factor_enabled: !!user.twoFactorEnabled,
        avatarUrl: user.avatarUrl,
        email_notifications: !!user.emailNotifications,
        sms_notifications: !!user.smsNotifications,
        sms_order_notifications: !!user.smsOrderNotifications,
        push_notifications: !!user.pushNotifications,
        promo_notifications: !!user.promoNotifications,
        order_notifications: !!user.orderNotifications,
        data_persistence: !!user.dataPersistence,
        public_profile: !!user.publicProfile,
      },
    });
  } catch (error) {
    console.error('Lỗi xác thực người dùng:', error);
    return ResponseWrapper.unauthorized('Phiên đăng nhập không hợp lệ');
  }
}
