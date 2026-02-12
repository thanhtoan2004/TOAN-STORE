import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN, ADMIN_TOKEN } from '@/lib/auth';

export async function POST() {
  // Xóa cả cookie auth_token và admin_token sử dụng hằng số
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN);
  cookieStore.delete(ADMIN_TOKEN);
  return NextResponse.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
}