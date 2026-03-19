import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { newsletterSubscriptions as newsletterTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { hashEmail } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Đăng ký bản tin (Newsletter Subscription).
 * Chức năng:
 * 1. Lưu email/tên khách hàng muốn nhận tin khuyến mãi.
 * 2. Tự động kích hoạt lại nếu email đã từng Unsubscribe.
 * 3. Bảo vệ bằng Rate Limit: Tối đa 5 lần thử/phút để tránh spam bots.
 */
async function newsletterHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, name } = await request.json();

    if (!email || !email.includes('@')) {
      return ResponseWrapper.error('Email không hợp lệ', 400);
    }

    // Kiểm tra email đã đăng ký chưa (Sử dụng Blind Index)
    const emailHash = hashEmail(email);
    const [existing] = await db
      .select()
      .from(newsletterTable)
      .where(eq(newsletterTable.emailHash, emailHash))
      .limit(1);

    if (existing) {
      if (existing.status === 'active') {
        return ResponseWrapper.error('Email này đã đăng ký nhận tin', 400);
      } else {
        // Reactive subscription
        await db
          .update(newsletterTable)
          .set({ status: 'active', unsubscribedAt: null })
          .where(eq(newsletterTable.emailHash, emailHash));

        return ResponseWrapper.success(null, 'Đã kích hoạt lại đăng ký nhận tin!');
      }
    }

    // Thêm subscription mới với PII protection
    const { encrypt } = await import('@/lib/security/encryption');

    await db.insert(newsletterTable).values({
      email: '***',
      emailHash,
      emailEncrypted: encrypt(email),
      isEncrypted: 1,
      name: name || null,
      status: 'active',
    });

    return ResponseWrapper.success(null, 'Đăng ký nhận tin thành công!');
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return ResponseWrapper.serverError('Không thể đăng ký nhận tin', error);
  }
}

// Rate limit: 5 requests per 60 seconds per IP to prevent spam
export const POST = withRateLimit(newsletterHandler, {
  tag: 'newsletter',
  limit: 5,
  windowMs: 60_000,
});
