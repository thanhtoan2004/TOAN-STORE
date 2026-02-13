import { executeQuery } from '../connection';

// Gift card functions
export async function checkGiftCardBalance(cardNumber: string, pin: string) {
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
    const pinMatch = await bcrypt.compare(pin, card.pin);

    if (!pinMatch) {
        return null;
    }

    return card;
}
