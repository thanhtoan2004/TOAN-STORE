import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/db/mysql';
import { JWTPayload } from '@/types/auth';

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy token' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as JWTPayload;

    const body = await request.json();
    const { firstName, lastName, phone, dateOfBirth, gender } = body;

    // Update user info
    await executeQuery(
      `UPDATE users 
       SET first_name = ?, 
           last_name = ?, 
           phone = ?, 
           date_of_birth = ?, 
           gender = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [firstName, lastName, phone || null, dateOfBirth || null, gender || null, decoded.userId]
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
