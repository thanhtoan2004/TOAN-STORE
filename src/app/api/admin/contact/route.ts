import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { contactMessages } from '@/lib/db/schema';
import { eq, or, like, desc, count, and } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy danh sách tin nhắn liên hệ từ khách hàng.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filters: any[] = [];

    if (status && status !== 'all') {
      filters.push(eq(contactMessages.status, status as any));
    }

    if (search) {
      filters.push(
        or(like(contactMessages.name, `%${search}%`), like(contactMessages.email, `%${search}%`))
      );
    }

    const data = await db
      .select()
      .from(contactMessages)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(contactMessages.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ total: count() })
      .from(contactMessages)
      .where(filters.length > 0 ? and(...filters) : undefined);

    const total = countResult?.total || 0;

    return ResponseWrapper.success(data, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
