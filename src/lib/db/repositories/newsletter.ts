import { db } from '../drizzle';
import { newsletterSubscriptions, users } from '../schema';
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
export async function getActiveSubscriptionEmails(): Promise<
  { email: string; name: string | null }[]
> {
  const result = await db
    .select({
      email: newsletterSubscriptions.email,
      emailEncrypted: newsletterSubscriptions.emailEncrypted,
      isEncrypted: newsletterSubscriptions.isEncrypted,
      newsletterName: newsletterSubscriptions.name,
      userFullName: users.fullName,
      userFirstName: users.firstName,
      userLastName: users.lastName,
    })
    .from(newsletterSubscriptions)
    .leftJoin(users, eq(newsletterSubscriptions.emailHash, users.emailHash))
    .where(eq(newsletterSubscriptions.status, 'active'));

  const { decrypt } = await import('@/lib/security/encryption');

  return result
    .map((r) => {
      let email = r.email;
      if (r.isEncrypted && r.emailEncrypted) {
        email = decrypt(r.emailEncrypted);
      }

      // Ưu tiên tên từ bảng users nếu có, sau đó mới đến bảng newsletter
      let name =
        r.userFullName ||
        (r.userFirstName && r.userLastName
          ? `${r.userFirstName} ${r.userLastName}`
          : r.userFirstName) ||
        r.newsletterName;

      return { email, name: name || null };
    })
    .filter((r) => r.email && r.email !== '***' && r.email.includes('@'));
}
