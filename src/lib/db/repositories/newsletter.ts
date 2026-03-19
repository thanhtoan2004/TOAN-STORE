import { db } from '../drizzle';
import { newsletterSubscriptions } from '../schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface NewsletterSub {
  id: number;
  email: string;
  name: string | null;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribedAt: Date;
}

/**
 * Lấy danh sách người đăng ký.
 */
export async function getSubscriptions(
  options: {
    page?: number;
    limit?: number;
  } = {}
): Promise<{ data: any[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 30;
  const offset = (page - 1) * limit;

  const data = await db
    .select()
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.status, 'active'))
    .orderBy(desc(newsletterSubscriptions.subscribedAt))
    .limit(limit)
    .offset(offset);

  const { decrypt } = await import('@/lib/security/encryption');
  const decryptedData = data.map((sub) => ({
    ...sub,
    email: sub.isEncrypted && sub.emailEncrypted ? decrypt(sub.emailEncrypted) : sub.email,
  }));

  const [totalResult] = await db
    .select({ count: sql`count(*)` })
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.status, 'active'));

  return {
    data: decryptedData,
    total: Number((totalResult as any)?.count || 0),
  };
}

/**
 * Lấy tất cả email người đăng ký active (dùng cho broadcast).
 */
export async function getActiveSubscriptionEmails(): Promise<string[]> {
  const result = await db
    .select({
      email: newsletterSubscriptions.email,
      emailEncrypted: newsletterSubscriptions.emailEncrypted,
      isEncrypted: newsletterSubscriptions.isEncrypted,
    })
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.status, 'active'));

  const { decrypt } = await import('@/lib/security/encryption');

  return result
    .map((r) => {
      if (r.isEncrypted && r.emailEncrypted) {
        return decrypt(r.emailEncrypted);
      }
      return r.email;
    })
    .filter((email) => email && email !== '***' && email.includes('@'));
}
