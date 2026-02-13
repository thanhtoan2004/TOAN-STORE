import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';

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
      [firstName, lastName, encrypt(phone || null), dateOfBirth || null, gender || null, session.userId]
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
