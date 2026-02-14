import { executeQuery } from '../connection';

// Gift card functions
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
    let pinMatch = false;

    // Check if it's an encrypted PIN (Level 3/AES-256) or a Legacy Bcrypt Hash
    if (card.pin && card.pin.includes(':')) {
        try {
            const decryptedPin = decrypt(card.pin);
            pinMatch = decryptedPin === pin;
        } catch (e) {
            pinMatch = false;
        }
    } else {
        // Fallback for legacy Bcrypt hashes
        pinMatch = await bcrypt.compare(pin, card.pin);
    }

    if (!pinMatch) {
        return null;
    }

    return card;
}
