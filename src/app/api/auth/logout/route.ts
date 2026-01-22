import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Xóa cookie auth_token
  const cookieStore = await cookies(); // Thêm await
  cookieStore.delete('auth_token');
  return NextResponse.json({ 
    success: true, 
    message: 'Đăng xuất thành công' 
  });
} 