import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { giftCards, giftCardTransactions } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { decrypt, encrypt, hashGiftCard } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý thẻ quà tặng (Gift Cards) - Admin.
 * Chức năng:
 * - GET: Liệt kê danh sách thẻ kèm Decrypted PIN phục vụ hỗ trợ khách hàng.
 * - POST: Phát hành thẻ mới (Mã hóa PIN và tạo log giao dịch khởi tạo).
 * Bảo mật: Yêu cầu quyền Admin cao cấp.
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

    const cards = await db
      .select()
      .from(giftCards)
      .orderBy(desc(giftCards.createdAt))
      .limit(limit)
      .offset(offset);

    // Decrypt PIN and Card Number for support purposes (Admin only)
    const decryptedCards = cards.map((card) => {
      const decryptedPin = decrypt(card.pin || '');
      const fullCardNumber = card.cardNumberEncrypted
        ? decrypt(card.cardNumberEncrypted)
        : `**** ${card.cardNumberLast4}`;

      return {
        id: card.id,
        card_number: fullCardNumber,
        pin: decryptedPin,
        initial_balance: parseFloat(card.initialBalance || '0'),
        current_balance: parseFloat(card.currentBalance || '0'),
        status: card.status,
        failed_attempts: card.failedAttempts || 0,
        expires_at: card.expiresAt,
        created_at: card.createdAt,
      };
    });

    const [{ total }] = await db.select({ total: count() }).from(giftCards);

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return ResponseWrapper.success(decryptedCards, undefined, 200, pagination);
  } catch (error) {
    console.error('Error fetching gift cards:', error);
    return ResponseWrapper.serverError('Lỗi server khi tải danh sách thẻ quà tặng', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { card_number, pin, initial_balance, expires_at } = await request.json();

    if (!card_number || !pin || initial_balance === undefined) {
      return ResponseWrapper.error(
        'Thiếu thông tin bắt buộc (card_number, pin, initial_balance)',
        400
      );
    }

    const hashedPinEncoded = encrypt(pin); // Variable 'pin' is sensitive
    const cardNumberHash = hashGiftCard(card_number);
    const cardNumberLast4 = card_number.slice(-4);

    await db.transaction(async (tx) => {
      // 1. Create Gift Card record with encrypted/hashed credentials
      const [insertResult] = await tx.insert(giftCards).values({
        cardNumberHash,
        cardNumberLast4,
        cardNumberEncrypted: encrypt(card_number),
        pin: hashedPinEncoded,
        initialBalance: String(initial_balance),
        currentBalance: String(initial_balance),
        status: 'active',
        expiresAt: expires_at ? new Date(expires_at) : null,
      });

      const insertId = (insertResult as any).insertId;

      // 2. Log initialization transaction for audit trail
      await tx.insert(giftCardTransactions).values({
        giftCardId: insertId,
        transactionType: 'purchase',
        amount: String(initial_balance),
        balanceBefore: '0',
        balanceAfter: String(initial_balance),
        description: 'Khởi tạo thẻ quà tặng bởi quản trị viên',
      });
    });

    return ResponseWrapper.success(null, 'Đã phát hành thẻ quà tặng mới thành công');
  } catch (error) {
    console.error('Error creating gift card:', error);
    return ResponseWrapper.serverError('Lỗi server khi tạo thẻ quà tặng', error);
  }
}
