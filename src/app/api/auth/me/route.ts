import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/db/mysql';
import { JWTPayload, UserWithoutPassword } from '@/types/auth';

export async function GET() {
  try {
    // Lấy token từ cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;


    if (!token) {
      return NextResponse.json(
        { error: 'Không tìm thấy token' },
        { status: 401 }
      );
    }

    // Xác thực token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as JWTPayload;

    // Lấy thông tin người dùng từ CSDL
    const users = await executeQuery(
      'SELECT id, email, first_name, last_name, phone, date_of_birth, gender, is_active, is_verified, is_admin, accumulated_points, membership_tier FROM users WHERE id = ?',
      [decoded.userId]
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
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        isActive: user.is_active,
        isVerified: user.is_verified,
        is_admin: user.is_admin,
        accumulatedPoints: user.accumulated_points || 0,
        membershipTier: user.membership_tier || 'bronze'
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