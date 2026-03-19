import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { db } from '@/lib/db/drizzle';
import { adminUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy thông tin tài khoản Admin hiện tại.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const [user] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        fullName: adminUsers.fullName,
        twoFactorEnabled: adminUsers.twoFactorEnabled,
        twoFactorType: adminUsers.twoFactorType,
        isActive: adminUsers.isActive,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, admin.userId))
      .limit(1);

    if (!user) {
      return ResponseWrapper.notFound('User not found');
    }

    return ResponseWrapper.success(user);
  } catch (error) {
    console.error('Error fetching current admin:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
