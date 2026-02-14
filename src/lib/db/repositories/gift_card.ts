
import { executeQuery, pool } from '../connection';

export interface GiftCard {
    id: number;
    code: string; // db column likely 'code' or 'card_number'? Check schema.
    pin: string;
    original_balance: number;
    current_balance: number;
    status: 'active' | 'used' | 'expired' | 'inactive';
    expiration_date: string;
}

// Based on order.ts scan, table is 'gift_cards', column 'card_number'.
// line 596: SELECT id, current_balance FROM gift_cards WHERE card_number = ?

export async function getGiftCardByNumber(cardNumber: string): Promise<GiftCard | null> {
    const cards = await executeQuery<GiftCard[]>(
        `SELECT * FROM gift_cards WHERE card_number = ? AND status = 'active' AND (expiration_date IS NULL OR expiration_date > NOW())`,
        [cardNumber]
    );
    return cards.length > 0 ? cards[0] : null;
}

export async function deductGiftCardBalance(id: number, amount: number, orderId: number | string, description: string = '') {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows]: any = await connection.execute(
            'SELECT current_balance FROM gift_cards WHERE id = ? FOR UPDATE',
            [id]
        );

        if (rows.length === 0) throw new Error('Gift card not found');
        const currentBalance = Number(rows[0].current_balance);

        if (currentBalance < amount) {
            throw new Error('Insufficient gift card balance');
        }

        const newBalance = currentBalance - amount;
        const status = newBalance === 0 ? 'used' : 'active';

        await connection.execute(
            'UPDATE gift_cards SET current_balance = ?, status = ? WHERE id = ?',
            [newBalance, status, id]
        );

        await connection.execute(
            `INSERT INTO gift_card_transactions 
       (gift_card_id, transaction_type, amount, balance_before, balance_after, description, order_id)
       VALUES (?, 'redeem', ?, ?, ?, ?, ?)`,
            [id, amount, currentBalance, newBalance, description, orderId]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function refundGiftCardBalance(id: number, amount: number, orderId: number | string, description: string = '') {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows]: any = await connection.execute(
            'SELECT current_balance FROM gift_cards WHERE id = ? FOR UPDATE',
            [id]
        );

        if (rows.length === 0) throw new Error('Gift card not found');
        const currentBalance = Number(rows[0].current_balance);
        const newBalance = currentBalance + amount;

        await connection.execute(
            'UPDATE gift_cards SET current_balance = ?, status = ? WHERE id = ?',
            [newBalance, 'active', id]
        );

        await connection.execute(
            `INSERT INTO gift_card_transactions 
       (gift_card_id, transaction_type, amount, balance_before, balance_after, description, order_id)
       VALUES (?, 'refund', ?, ?, ?, ?, ?)`,
            [id, amount, currentBalance, newBalance, description, orderId]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
