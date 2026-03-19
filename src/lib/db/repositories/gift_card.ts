import { db } from '../drizzle';
import { giftCards, giftCardTransactions } from '../schema';
import { eq, and, gt, or, isNull, sql } from 'drizzle-orm';

export interface GiftCard {
  id: number;
  cardNumberHash: string;
  cardNumberLast4: string;
  pin: string;
  originalBalance: number;
  currentBalance: number;
  status: 'active' | 'used' | 'expired' | 'inactive';
  expirationDate: string;
}

export async function getGiftCardByNumber(cardNumber: string): Promise<any | null> {
  // Assuming cardNumber here is the hash or needs hashing,
  // but looking at getGiftCardByNumber implementation, it uses `cardNumber_hash` column.
  const [card] = await db
    .select()
    .from(giftCards)
    .where(
      and(
        eq(giftCards.cardNumberHash, cardNumber),
        eq(giftCards.status, 'active'),
        or(isNull(giftCards.expirationDate), gt(giftCards.expirationDate, new Date()))
      )
    )
    .limit(1);

  return card || null;
}

export async function deductGiftCardBalance(
  id: number,
  amount: number,
  orderId: number | string,
  description: string = ''
) {
  return await db.transaction(async (tx) => {
    const [card] = await tx
      .select({ currentBalance: giftCards.currentBalance })
      .from(giftCards)
      .where(eq(giftCards.id, id))
      .forUpdate();

    if (!card) throw new Error('Gift card not found');
    const currentBalance = Number(card.currentBalance);

    if (currentBalance < amount) {
      throw new Error('Insufficient gift card balance');
    }

    const newBalance = currentBalance - amount;
    const status = newBalance === 0 ? 'used' : 'active';

    await tx
      .update(giftCards)
      .set({ currentBalance: String(newBalance), status })
      .where(eq(giftCards.id, id));

    await tx.insert(giftCardTransactions).values({
      giftCardId: id,
      transactionType: 'redeem',
      amount: String(amount),
      balanceBefore: String(currentBalance),
      balanceAfter: String(newBalance),
      description,
      orderId: Number(orderId),
    });

    return true;
  });
}

export async function refundGiftCardBalance(
  id: number,
  amount: number,
  orderId: number | string,
  description: string = ''
) {
  return await db.transaction(async (tx) => {
    const [card] = await tx
      .select({ currentBalance: giftCards.currentBalance })
      .from(giftCards)
      .where(eq(giftCards.id, id))
      .forUpdate();

    if (!card) throw new Error('Gift card not found');
    const currentBalance = Number(card.currentBalance);
    const newBalance = currentBalance + amount;

    await tx
      .update(giftCards)
      .set({ currentBalance: String(newBalance), status: 'active' })
      .where(eq(giftCards.id, id));

    await tx.insert(giftCardTransactions).values({
      giftCardId: id,
      transactionType: 'refund',
      amount: String(amount),
      balanceBefore: String(currentBalance),
      balanceAfter: String(newBalance),
      description,
      orderId: Number(orderId),
    });

    return true;
  });
}
