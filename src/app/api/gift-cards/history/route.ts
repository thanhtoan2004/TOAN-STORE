import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api/api-utils';
import { executeQuery } from '@/lib/db/mysql';
import { decrypt } from '@/lib/security/encryption';

// Cấu hình giới hạn
const MAX_IP_ATTEMPTS_PER_30MIN = 8;
const MAX_CARD_FAILED_ATTEMPTS = 5;

// Lấy IP của user
function getClientIp(req: NextRequest) {
  let ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  return ip;
}

// GET - Lấy lịch sử giao dịch thẻ quà tặng
/**
 * API Tra cứu lịch sử giao dịch của thẻ quà tặng kèm Bảo mật chống Brute Force.
 * Áp dụng Lockout IP sau 8 lần sai và khóa thẻ sau 5 lần sai.
 */
async function giftcardHistoryHandler(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const cardNumber = searchParams.get('cardNumber');
  const pin = searchParams.get('pin');
  const clientIp = getClientIp(req);

  if (!cardNumber || !pin) {
    return createErrorResponse('Thiếu số thẻ hoặc mã PIN', 400);
  }

  // 1. Kiểm tra IP Lockout
  const ipLockouts = await executeQuery<any[]>(
    `SELECT attempt_count, locked_until FROM gift_card_lockouts 
     WHERE ip_address = ? AND (locked_until IS NULL OR locked_until > NOW()) 
     AND last_attempt >= NOW() - INTERVAL 30 MINUTE`,
    [clientIp]
  );

  let currentIpAttempts = 0;
  let lockoutId = null;

  if (ipLockouts && ipLockouts.length > 0) {
    const lockout = ipLockouts[0];
    if (lockout.locked_until && new Date(lockout.locked_until) > new Date()) {
      return createErrorResponse(
        'Bạn đã tra cứu sai quá nhiều lần. Vui lòng thử lại sau 30 phút.',
        429
      );
    }
    currentIpAttempts = lockout.attempt_count;
    // Get ID logic
    const ids = await executeQuery<any[]>(
      'SELECT id FROM gift_card_lockouts WHERE ip_address = ? ORDER BY last_attempt DESC LIMIT 1',
      [clientIp]
    );
    if (ids.length > 0) lockoutId = ids[0].id;
  }

  // 2. Tìm thẻ trong DB (Chỉ tìm bằng số thẻ)
  const cards = await executeQuery<any[]>(
    `SELECT id, card_number, pin as encrypted_pin, current_balance, status, failed_attempts, expires_at, created_at 
     FROM gift_cards WHERE card_number = ?`,
    [cardNumber]
  );

  if (!cards || cards.length === 0) {
    // Sai số thẻ hoàn toàn -> Phạt IP
    await handleIpPenalty(clientIp, currentIpAttempts, lockoutId);
    return createErrorResponse('Thẻ quà tặng không tồn tại hoặc sai thông tin', 404);
  }

  const card = cards[0];

  // 3. Kiểm tra thẻ đã bị khóa chưa
  if (card.status === 'locked' || card.failed_attempts >= MAX_CARD_FAILED_ATTEMPTS) {
    return createErrorResponse(
      'Thẻ đã bị khóa do nhập sai PIN nhiều lần. Vui lòng liên hệ hỗ trợ.',
      403
    );
  }

  // 4. Xác thực mã PIN
  const decryptedPin = decrypt(card.encrypted_pin);
  if (decryptedPin !== pin) {
    // Sai PIN -> Phạt IP + Tăng failed_attempts của thẻ
    await handleIpPenalty(clientIp, currentIpAttempts, lockoutId);

    const newFailed = (card.failed_attempts || 0) + 1;
    let query = 'UPDATE gift_cards SET failed_attempts = ? WHERE id = ?';
    let params: any[] = [newFailed, card.id];

    if (newFailed >= MAX_CARD_FAILED_ATTEMPTS) {
      query = 'UPDATE gift_cards SET failed_attempts = ?, status = ? WHERE id = ?';
      params = [newFailed, 'locked', card.id];
    }

    await executeQuery(query, params);

    if (newFailed >= MAX_CARD_FAILED_ATTEMPTS) {
      return createErrorResponse('Thẻ đã bị khóa do nhập sai PIN quá 5 lần.', 403);
    }
    return createErrorResponse('Thẻ quà tặng không tồn tại hoặc sai thông tin', 404); // Cố tình báo lỗi chung chung để chặn dò
  }

  // 5. Nếu Thành công -> Reset IP Attempts (Tùy chọn, ở đây ta reset cho sạch lịch sử IP này)
  if (lockoutId) {
    await executeQuery('DELETE FROM gift_card_lockouts WHERE id = ?', [lockoutId]);
  }
  // Reset failed attempts của bản thân thẻ
  if (card.failed_attempts > 0) {
    await executeQuery('UPDATE gift_cards SET failed_attempts = 0 WHERE id = ?', [card.id]);
  }

  // 6. Trả về lịch sử giao dịch
  const transactions = await executeQuery<any[]>(
    `SELECT 
      id, transaction_type, amount, balance_before, balance_after, description, created_at, order_id
     FROM gift_card_transactions 
     WHERE gift_card_id = ? 
     ORDER BY created_at DESC`,
    [card.id]
  );

  return createSuccessResponse(
    {
      card: {
        cardNumber: card.card_number,
        currentBalance: card.current_balance,
        status: card.status,
        expiresAt: card.expires_at,
        createdAt: card.created_at,
      },
      transactions: transactions.map((t: any) => ({
        id: t.id,
        type: t.transaction_type,
        amount: t.amount,
        balanceBefore: t.balance_before,
        balanceAfter: t.balance_after,
        description: t.description,
        orderId: t.order_id,
        createdAt: t.created_at,
      })),
    },
    'Lấy lịch sử thành công'
  );
}

// Hàm phụ trợ phạt IP
async function handleIpPenalty(ip: string, currentAttempts: number, lockoutId: number | null) {
  const newAttempts = currentAttempts + 1;
  let lockedUntil = null;

  if (newAttempts >= MAX_IP_ATTEMPTS_PER_30MIN) {
    lockedUntil = new Date(Date.now() + 30 * 60000); // 30 mins
  }

  if (lockoutId) {
    await executeQuery(
      'UPDATE gift_card_lockouts SET attempt_count = ?, locked_until = ?, last_attempt = NOW() WHERE id = ?',
      [
        newAttempts,
        lockedUntil ? lockedUntil.toISOString().slice(0, 19).replace('T', ' ') : null,
        lockoutId,
      ]
    );
  } else {
    await executeQuery(
      'INSERT INTO gift_card_lockouts (ip_address, attempt_count, locked_until) VALUES (?, ?, ?)',
      [
        ip,
        newAttempts,
        lockedUntil ? lockedUntil.toISOString().slice(0, 19).replace('T', ' ') : null,
      ]
    );
  }
}

export const GET = withErrorHandling(giftcardHistoryHandler);
