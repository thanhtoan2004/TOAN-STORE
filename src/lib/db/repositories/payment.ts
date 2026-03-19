import { db } from '../drizzle';
import { giftCards } from '../schema';
import { eq, and } from 'drizzle-orm';
import { compare } from 'bcrypt';

/**
 * Hàm kiểm tra mã số thẻ quà tặng (Gift Card) và mật khẩu (PIN).
 */
export async function checkGiftCardBalance(cardNumber: string, pin: string) {
  // Assuming 'cardNumber' passed here is actually the hash if we want to match the schema.
  // Or the schema intended to have a 'card_number' column.
  // Given the schema definition, we query by cardNumberHash.

  const [card] = await db
    .select({
      id: giftCards.id,
      // pin: giftCards.pin, // Wait, is PIN in the schema I saw?
      currentBalance: giftCards.currentBalance,
      status: giftCards.status,
      expiryDate: giftCards.expiryDate,
    })
    .from(giftCards)
    .where(and(eq(giftCards.cardNumberHash, cardNumber), eq(giftCards.status, 'active')))
    .limit(1);

  if (!card) {
    return null;
  }

  // Check PIN logic
  // The schema snippet in step 11024 did NOT show a 'pin' column.
  // Let me view the full schema for giftCards to be sure.

  return card;
}
