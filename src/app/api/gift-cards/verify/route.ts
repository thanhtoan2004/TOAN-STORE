import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { giftCards, giftCardLockouts } from '@/lib/db/schema';
import { eq, and, or, sql, desc, isNull, gt, gte } from 'drizzle-orm';
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

// Hàm ghi log phạt IP
async function handleIpPenalty(
  clientIp: string,
  currentAttempts: number,
  lockoutId: number | null
) {
  const newAttempts = currentAttempts + 1;
  let lockoutUntil = null;
  if (newAttempts >= MAX_IP_ATTEMPTS_PER_30MIN) {
    lockoutUntil = new Date(Date.now() + 30 * 60000); // Khóa 30 phút
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
      ipAddress: clientIp,
      attemptCount: newAttempts,
      lockoutUntil,
    });
  }
}

/**
 * API Kiểm tra số dư và trạng thái thẻ quà tặng.
 */
export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { cardNumber, pin } = body;

    if (!cardNumber || !pin) {
      return ResponseWrapper.error('Thiếu số thẻ hoặc mã PIN', 400);
    }

    if (!/^\d{16}$/.test(cardNumber)) {
      return ResponseWrapper.error('Số thẻ quà tặng không hợp lệ', 400);
    }

    if (!/^\d{4}$/.test(pin)) {
      return ResponseWrapper.error('Mã PIN không hợp lệ', 400);
    }

    const hashedCardNumber = hashGiftCard(cardNumber);

    // 1. Kiểm tra IP Lockout
    const clientIp = getClientIp(req);
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
          'Bạn đã nhập thẻ sai quá nhiều lần. Vui lòng thử lại sau 30 phút.',
          429
        );
      }
      currentIpAttempts = lockout.attemptCount || 0;
      lockoutId = lockout.id;
    }

    // 2. Tìm thẻ trong DB (Drizzle schema used cardNumberHash for card_number)
    const [card] = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.cardNumberHash, hashedCardNumber))
      .limit(1);

    if (!card) {
      await handleIpPenalty(clientIp, currentIpAttempts, lockoutId);
      return ResponseWrapper.error('Thẻ quà tặng không tồn tại hoặc sai thông tin', 404);
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
      return ResponseWrapper.error('Thẻ quà tặng không tồn tại hoặc sai thông tin', 404);
    }

    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      return ResponseWrapper.error('Thẻ quà tặng đã hết hạn', 400);
    }

    if (lockoutId) {
      await db.delete(giftCardLockouts).where(eq(giftCardLockouts.id, lockoutId));
    }

    return ResponseWrapper.success(
      {
        balance: card.currentBalance,
        expiresAt: card.expiresAt,
        status: card.status,
      },
      'Kiểm tra thẻ quà tặng thành công'
    );
  } catch (error) {
    console.error('Error verifying gift card:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
