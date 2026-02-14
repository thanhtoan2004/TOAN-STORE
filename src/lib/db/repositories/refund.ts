import { executeQuery } from '../mysql';

export interface RefundRequest {
    id: number;
    order_id: number;
    user_id: number;
    amount: number;
    reason: string;
    images: string[];
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    admin_response?: string;
    created_at: string;
    updated_at: string;
}

export async function createRefundRequest(
    userId: number,
    orderId: number,
    amount: number,
    reason: string,
    images: string[]
): Promise<number> {
    const result = await executeQuery<any>(
        `INSERT INTO refund_requests (user_id, order_id, amount, reason, images, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [userId, orderId, amount, reason, JSON.stringify(images)]
    );
    return result.insertId;
}

export async function getRefundByOrder(orderId: number): Promise<RefundRequest | null> {
    const rows = await executeQuery<any[]>(
        `SELECT * FROM refund_requests WHERE order_id = ?`,
        [orderId]
    );
    return rows.length > 0 ? rows[0] : null;
}

export async function getRefundById(id: number): Promise<RefundRequest | null> {
    const rows = await executeQuery<any[]>(
        `SELECT r.*, u.full_name as user_name, u.email as user_email, o.order_number 
         FROM refund_requests r
         JOIN users u ON r.user_id = u.id
         JOIN orders o ON r.order_id = o.id
         WHERE r.id = ?`,
        [id]
    );
    return rows.length > 0 ? rows[0] : null;
}

export async function getUserRefunds(userId: number): Promise<RefundRequest[]> {
    const rows = await executeQuery<any[]>(
        `SELECT r.*, o.order_number 
         FROM refund_requests r
         JOIN orders o ON r.order_id = o.id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [userId]
    );
    return rows;
}

export async function getAllRefunds(
    page: number = 1,
    limit: number = 20,
    status?: string
): Promise<{ refunds: any[], total: number }> {
    const offset = (page - 1) * limit;
    let query = `
        SELECT r.*, u.full_name as user_name, u.email as user_email, o.order_number 
        FROM refund_requests r
        JOIN users u ON r.user_id = u.id
        JOIN orders o ON r.order_id = o.id
    `;
    const params: any[] = [];

    if (status) {
        query += ` WHERE r.status = ?`;
        params.push(status);
    }

    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const refunds = await executeQuery<any[]>(query, params);

    // Count
    let countQuery = `SELECT COUNT(*) as total FROM refund_requests r`;
    const countParams: any[] = [];
    if (status) {
        countQuery += ` WHERE r.status = ?`;
        countParams.push(status);
    }
    const countResult = await executeQuery<any[]>(countQuery, countParams);

    return {
        refunds,
        total: countResult[0]?.total || 0
    };
}

export async function updateRefundStatus(
    id: number,
    status: string,
    response: string
): Promise<boolean> {
    const result = await executeQuery<any>(
        `UPDATE refund_requests SET status = ?, admin_response = ? WHERE id = ?`,
        [status, response, id]
    );

    // FIX: If Approved -> Trigger Order Refund Logic (Stock Release, Point Deduction)
    if (result.affectedRows > 0 && status === 'approved') {
        try {
            const rows = await executeQuery<any[]>(
                `SELECT o.order_number 
                 FROM refund_requests r
                 JOIN orders o ON r.order_id = o.id
                 WHERE r.id = ?`,
                [id]
            );

            if (rows.length > 0) {
                const { order_number } = rows[0];
                const { updateOrderStatus } = await import('./order');
                await updateOrderStatus(order_number, 'refunded');
                console.log(`[Refund] Auto-refunded Order #${order_number}`);
            }
        } catch (error) {
            console.error('[Refund] Error auto-updating order status:', error);
            // Note: We don't rollback the refund approval itself, but log the error.
        }
    }

    return result.affectedRows > 0;
}
