import { NextRequest } from 'next/server';
import { GET as userGet } from '../user/route';

/**
 * Alias Endpoint cho /api/auth/user
 * Đảm bảo dùng 'await' để Next.js trả về nội dung Body.
 */
export async function GET(req: NextRequest) {
  return await userGet();
}
