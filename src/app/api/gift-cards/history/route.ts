import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { giftCards, giftCardLockouts, giftCardTransactions } from '@/lib/db/schema';
import { eq, and, sql, desc, or, isNull, gt, gte } from 'drizzle-orm';
import { decrypt, hashGiftCard } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

// Cấu hình giới hạn
const MAX_IP_ATTEMPTS_PER_30MIN = 8;
const MAX_CARD_FAILED_ATTEMPTS = 5;

// Lấy IP của user
function getClientIp(req: NextRequest) {
  let ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  return ip;
}

/**
 * API Tra cứu lịch sử giao dịch của thẻ quà tặng.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cardNumber = searchParams.get('cardNumber');
    const pin = searchParams.get('pin');
    const clientIp = getClientIp(req);

    if (!cardNumber || !pin) {
      return ResponseWrapper.error('Thiếu số thẻ hoặc mã PIN', 400);
    }

    const hashedCardNumber = hashGiftCard(cardNumber);

    // 1. Kiểm tra IP Lockout
    const [lockout] = await db
      .select()
      .from(giftCardLockouts)
      .where(
        and(
          eq(giftCardLockouts.ipAddress, clientIp),
          or(isNull(giftCardLockouts.lockoutUntil), gt(giftCardLockouts.lockoutUntil, new Date()))!,
          gte(giftCardLockouts.lastAttempt, sql`NOW() - INTERVAL 30 MINUTE`)
        )
      )
      .orderBy(desc(giftCardLockouts.lastAttempt))
      .limit(1);

    let currentIpAttempts = 0;
    let lockoutId = null;

    if (lockout) {
      if (lockout.lockoutUntil && new Date(lockout.lockoutUntil) > new Date()) {
        return ResponseWrapper.error(
          'Bạn đã tra cứu sai quá nhiều lần. Vui lòng thử lại sau 30 phút.',
          429
        );
      }
      currentIpAttempts = lockout.attemptCount || 0;
      lockoutId = lockout.id;
    }

    // 2. Tìm thẻ trong DB (Drizzle schema used cardNumberHash)
    const [card] = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.cardNumberHash, hashedCardNumber))
      .limit(1);

    if (!card) {
      await handleIpPenalty(clientIp, currentIpAttempts, lockoutId);
      return ResponseWrapper.notFound('Thẻ quà tặng không tồn tại hoặc sai thông tin');
    }

    // 3. Kiểm tra thẻ đã bị khóa chưa
    if (card.status === 'locked' || (card.failedAttempts || 0) >= MAX_CARD_FAILED_ATTEMPTS) {
      return ResponseWrapper.forbidden(
        'Thẻ đã bị khóa do nhập sai PIN nhiều lần. Vui lòng liên hệ hỗ trợ.'
      );
    }

    // 4. Xác thực mã PIN
    const decryptedPin = decrypt(card.pin || '');
    if (decryptedPin !== pin) {
      await handleIpPenalty(clientIp, currentIpAttempts, lockoutId);

      const newFailed = (card.failedAttempts || 0) + 1;
      const updateData: any = { failedAttempts: newFailed };
      if (newFailed >= MAX_CARD_FAILED_ATTEMPTS) {
        updateData.status = 'locked';
      }

      await db.update(giftCards).set(updateData).where(eq(giftCards.id, card.id));

      if (newFailed >= MAX_CARD_FAILED_ATTEMPTS) {
        return ResponseWrapper.forbidden('Thẻ đã bị khóa do nhập sai PIN quá 5 lần.');
      }
      return ResponseWrapper.notFound('Thẻ quà tặng không tồn tại hoặc sai thông tin');
    }

    // 5. Thành công -> Reset
    if (lockoutId) {
      await db.delete(giftCardLockouts).where(eq(giftCardLockouts.id, lockoutId));
    }
    if ((card.failedAttempts || 0) > 0) {
      await db.update(giftCards).set({ failedAttempts: 0 }).where(eq(giftCards.id, card.id));
    }

    // 6. Trả về lịch sử giao dịch
    const transactions = await db
      .select()
      .from(giftCardTransactions)
      .where(eq(giftCardTransactions.giftCardId, card.id))
      .orderBy(desc(giftCardTransactions.createdAt));

    return ResponseWrapper.success(
      {
        card: {
          cardNumber: card.cardNumberHash,
          currentBalance: card.currentBalance,
          status: card.status,
          expiresAt: card.expiresAt,
          createdAt: card.createdAt,
        },
        transactions: transactions.map((t: any) => ({
          id: t.id,
          type: t.transactionType,
          amount: t.amount,
          balanceBefore: t.balanceBefore,
          balanceAfter: t.balanceAfter,
          description: t.description,
          orderId: t.orderId,
          createdAt: t.createdAt,
        })),
      },
      'Lấy lịch sử thành công'
    );
  } catch (error) {
    console.error('Gift card history error:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// Hàm phụ trợ phạt IP
async function handleIpPenalty(ip: string, currentAttempts: number, lockoutId: number | null) {
  const newAttempts = currentAttempts + 1;
  let lockoutUntil = null;

  if (newAttempts >= MAX_IP_ATTEMPTS_PER_30MIN) {
    lockoutUntil = new Date(Date.now() + 30 * 60000); // 30 mins
  }

  if (lockoutId) {
    await db
      .update(giftCardLockouts)
      .set({
        attemptCount: newAttempts,
        lockoutUntil,
        lastAttempt: new Date(),
      })
      .where(eq(giftCardLockouts.id, lockoutId));
  } else {
    await db.insert(giftCardLockouts).values({
      ipAddress: ip,
      attemptCount: newAttempts,
      lockoutUntil,
    });
  }
}
