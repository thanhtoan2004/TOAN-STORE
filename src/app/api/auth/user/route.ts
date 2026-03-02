import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';

/**
 * API Lấy thông tin cá nhân của người dùng hiện tại.
 * Dữ liệu bao gồm: Profile, Điểm tích lũy, Hạng thành viên và trạng thái 2FA.
 * Tự động giải mã số điện thoại (PII) trước khi trả về frontend.
 */
export async function GET() {
  try {
    const session = await verifyAuth();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Lấy thông tin người dùng từ CSDL
    const users = await executeQuery(
      `SELECT id, email, first_name, last_name, phone, date_of_birth, gender, 
              is_active, is_verified, is_admin, accumulated_points, membership_tier, 
              two_factor_enabled, avatar_url, email_notifications, sms_notifications, 
              sms_order_notifications, push_notifications, promo_notifications, 
              order_notifications, data_persistence, public_profile 
       FROM users WHERE id = ? AND deleted_at IS NULL`,
      [session.userId]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    const user = users[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: decrypt(user.phone),
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        isActive: user.is_active,
        isVerified: user.is_verified,
        is_admin: user.is_admin,
        accumulatedPoints: user.accumulated_points || 0,
        membershipTier: user.membership_tier || 'bronze',
        two_factor_enabled: user.two_factor_enabled === 1 || user.two_factor_enabled === '1' || user.two_factor_enabled === true,
        avatarUrl: user.avatar_url,
        email_notifications: !!user.email_notifications,
        sms_notifications: !!user.sms_notifications,
        sms_order_notifications: !!user.sms_order_notifications,
        push_notifications: !!user.push_notifications,
        promo_notifications: !!user.promo_notifications,
        order_notifications: !!user.order_notifications,
        data_persistence: !!user.data_persistence,
        public_profile: !!user.public_profile
      }
    });
  } catch (error) {
    console.error('Lỗi xác thực người dùng:', error);
    return NextResponse.json(
      { error: 'Phiên đăng nhập không hợp lệ' },
      { status: 401 }
    );
  }
} 