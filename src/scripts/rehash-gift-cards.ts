import { db } from '../lib/db/drizzle';
import { giftCards } from '../lib/db/schema';
import { eq, sql, and, like } from 'drizzle-orm';
import { createHash } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PEPPER = process.env.GIFT_CARD_PEPPER || 'toan-store-gift-card-secure-pepper-2026-v1-!@#$';

async function rehashGiftCards() {
  try {
    console.log('--- Starting Gift Card Rehash (SEC-02) ---');

    // Mẫu data cho các thẻ quà tặng từ db.sql (những mã này được lấy từ lịch sử đơn hàng hoặc tài liệu)
    const cardMappings: Record<string, string> = {
      '4567': '2345678901234567', // Link from NK1765093418497
      '5678': '1234567812345678', // Sample
      '6789': '6969696969696969', // Sample from plan notes
      '3456': '1122334455667788', // Link from NK1769773670916
      '7654': '8877665544332211', // Sample
    };

    const cards = await db
      .select({
        id: giftCards.id,
        cardNumberLast4: giftCards.cardNumberLast4,
        cardNumberHash: giftCards.cardNumberHash,
      })
      .from(giftCards)
      .where(like(giftCards.cardNumberHash, 'REPLACE_WITH_SHA2_HASH%'));

    for (const card of cards) {
      const rawNumber = cardMappings[card.cardNumberLast4];
      if (rawNumber) {
        const hash = createHash('sha256')
          .update(rawNumber + PEPPER)
          .digest('hex');

        await db.update(giftCards).set({ cardNumberHash: hash }).where(eq(giftCards.id, card.id));

        console.log(`[OK] Rehashed card ID ${card.id} (ending in ${card.cardNumberLast4})`);
      } else {
        console.warn(
          `[WARN] No raw number mapping found for card ID ${card.id} (last4: ${card.cardNumberLast4})`
        );
      }
    }

    console.log('--- Gift Card Rehash Completed ---');
  } catch (error) {
    console.error('Error during rehashing:', error);
  } finally {
    process.exit(0);
  }
}

rehashGiftCards();
