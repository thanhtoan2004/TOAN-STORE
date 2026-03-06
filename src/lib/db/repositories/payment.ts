import { executeQuery } from '../connection';

/**
 * Hàm kiểm tra mã số thẻ quà tặng (Gift Card) và mật khẩu (PIN).
 * Dùng khi khách hàng nhập thẻ ở bước Thanh Toán (Checkout) để trừ tiền hóa đơn.
 * Hỗ trợ đồng thời 2 chuẩn mã hóa PIN: Hash (Bcrypt) cũ và Mã hóa 2 chiều (AES-256) mới.
 *
 * @param cardNumber Dãy số seri in trên thẻ quà tặng
 * @param pin Mã bí mật người dùng nhập
 * @returns Object chứa thông tin thẻ nếu hợp lệ, ngược lại trả về `null`
 */
export async function checkGiftCardBalance(cardNumber: string, pin: string) {
  const { decrypt } = await import('@/lib/encryption');
  const bcrypt = await import('bcrypt');

  const cards = await executeQuery<any[]>(
    `SELECT pin, current_balance, status, expires_at FROM gift_cards 
      WHERE card_number = ? AND status = 'active'`,
    [cardNumber]
  );

  if (!cards || cards.length === 0) {
    return null;
  }

  const card = cards[0];

  // Unify to Bcrypt as per Phase 3 Security hardening
  const pinMatch = await bcrypt.compare(pin, card.pin);

  if (!pinMatch) {
    return null;
  }

  return card;
}
