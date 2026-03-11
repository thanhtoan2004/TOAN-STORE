import { pool } from '../lib/db/connection';
import { createHash } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PEPPER = process.env.GIFT_CARD_PEPPER || 'toan-store-gift-card-secure-pepper-2026-v1-!@#$';

async function rehashGiftCards() {
  const connection = await pool.getConnection();
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

    const [cards]: any = await connection.execute(
      'SELECT id, card_number_last4, card_number_hash FROM gift_cards'
    );

    for (const card of cards) {
      if (card.card_number_hash.startsWith('REPLACE_WITH_SHA2_HASH')) {
        const rawNumber = cardMappings[card.card_number_last4];
        if (rawNumber) {
          const hash = createHash('sha256')
            .update(rawNumber + PEPPER)
            .digest('hex');
          await connection.execute('UPDATE gift_cards SET card_number_hash = ? WHERE id = ?', [
            hash,
            card.id,
          ]);
          console.log(`[OK] Rehashed card ID ${card.id} (ending in ${card.card_number_last4})`);
        } else {
          console.warn(
            `[WARN] No raw number mapping found for card ID ${card.id} (last4: ${card.card_number_last4})`
          );
        }
      } else {
        console.log(`[SKIP] Card ID ${card.id} already hashed or not a placeholder.`);
      }
    }

    console.log('--- Gift Card Rehash Completed ---');
  } catch (error) {
    console.error('Error during rehashing:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

rehashGiftCards();
