import { query } from '@/lib/db/mysql';

interface ReservationItem {
    productVariantId: number;
    quantity: number;
}

interface Reservation {
    sessionId: string;
    items: ReservationItem[];
    expiresAt: Date;
}

const RESERVATION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Reserve stock for checkout
 * Tạo reservation để giữ stock trong khi user đang checkout
 */
export async function reserveStock(
    sessionId: string,
    items: ReservationItem[]
): Promise<{ success: boolean; message?: string }> {
    try {
        // Check if there's enough stock for all items
        for (const item of items) {
            const [inventory] = await query(
                `SELECT quantity, reserved FROM inventory WHERE product_variant_id = ?`,
                [item.productVariantId]
            );

            if (!inventory) {
                return {
                    success: false,
                    message: `Sản phẩm không tồn tại trong kho`
                };
            }

            const available = inventory.quantity - inventory.reserved;
            if (available < item.quantity) {
                return {
                    success: false,
                    message: `Không đủ hàng trong kho. Chỉ còn ${available} sản phẩm`
                };
            }
        }

        // Reserve stock by updating the reserved field
        for (const item of items) {
            await query(
                `UPDATE inventory 
         SET reserved = reserved + ? 
         WHERE product_variant_id = ?`,
                [item.quantity, item.productVariantId]
            );
        }

        // Store reservation info (you might want to create a reservations table)
        // For now, we'll use a simple approach with session storage
        const expiresAt = new Date(Date.now() + RESERVATION_TIMEOUT);

        // Optional: Create reservations table entry
        await query(
            `INSERT INTO stock_reservations (session_id, items, expires_at, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       items = VALUES(items),
       expires_at = VALUES(expires_at)`,
            [sessionId, JSON.stringify(items), expiresAt]
        );

        return { success: true };
    } catch (error) {
        console.error('Error reserving stock:', error);
        return {
            success: false,
            message: 'Lỗi khi đặt chỗ sản phẩm'
        };
    }
}

/**
 * Release reserved stock
 * Giải phóng stock đã reserve khi user hủy hoặc timeout
 */
export async function releaseStock(
    sessionId: string
): Promise<{ success: boolean }> {
    try {
        // Get reservation info
        const [reservation] = await query(
            `SELECT items FROM stock_reservations WHERE session_id = ?`,
            [sessionId]
        );

        if (!reservation) {
            return { success: true }; // No reservation to release
        }

        const items: ReservationItem[] = JSON.parse(reservation.items);

        // Release stock
        for (const item of items) {
            await query(
                `UPDATE inventory 
         SET reserved = GREATEST(0, reserved - ?) 
         WHERE product_variant_id = ?`,
                [item.quantity, item.productVariantId]
            );
        }

        // Delete reservation record
        await query(
            `DELETE FROM stock_reservations WHERE session_id = ?`,
            [sessionId]
        );

        return { success: true };
    } catch (error) {
        console.error('Error releasing stock:', error);
        return { success: false };
    }
}

/**
 * Confirm stock (deduct from inventory after successful order)
 * Trừ stock thực tế sau khi order thành công
 */
export async function confirmStock(
    sessionId: string
): Promise<{ success: boolean }> {
    try {
        // Get reservation info
        const [reservation] = await query(
            `SELECT items FROM stock_reservations WHERE session_id = ?`,
            [sessionId]
        );

        if (!reservation) {
            return { success: false };
        }

        const items: ReservationItem[] = JSON.parse(reservation.items);

        // Deduct from quantity and reserved
        for (const item of items) {
            await query(
                `UPDATE inventory 
         SET quantity = GREATEST(0, quantity - ?),
             reserved = GREATEST(0, reserved - ?)
         WHERE product_variant_id = ?`,
                [item.quantity, item.quantity, item.productVariantId]
            );

            // Log inventory change
            await query(
                `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id, created_at)
         SELECT id, ?, 'order_confirmed', ?, NOW()
         FROM inventory
         WHERE product_variant_id = ?`,
                [-item.quantity, sessionId, item.productVariantId]
            );
        }

        // Delete reservation record
        await query(
            `DELETE FROM stock_reservations WHERE session_id = ?`,
            [sessionId]
        );

        return { success: true };
    } catch (error) {
        console.error('Error confirming stock:', error);
        return { success: false };
    }
}

/**
 * Clean up expired reservations
 * Tự động giải phóng các reservation đã hết hạn
 */
export async function cleanupExpiredReservations(): Promise<void> {
    try {
        // Get all expired reservations
        const expiredReservations = await query(
            `SELECT session_id, items FROM stock_reservations WHERE expires_at < NOW()`
        );

        for (const reservation of expiredReservations as any[]) {
            const items: ReservationItem[] = JSON.parse(reservation.items);

            // Release stock
            for (const item of items) {
                await query(
                    `UPDATE inventory 
           SET reserved = GREATEST(0, reserved - ?) 
           WHERE product_variant_id = ?`,
                    [item.quantity, item.productVariantId]
                );
            }
        }

        // Delete expired reservations
        await query(
            `DELETE FROM stock_reservations WHERE expires_at < NOW()`
        );

        console.log(`Cleaned up ${expiredReservations.length} expired reservations`);
    } catch (error) {
        console.error('Error cleaning up expired reservations:', error);
    }
}

/**
 * Get reservation status
 * Kiểm tra trạng thái reservation
 */
export async function getReservationStatus(
    sessionId: string
): Promise<{ exists: boolean; expiresAt?: Date; items?: ReservationItem[] }> {
    try {
        const [reservation] = await query(
            `SELECT items, expires_at FROM stock_reservations WHERE session_id = ?`,
            [sessionId]
        );

        if (!reservation) {
            return { exists: false };
        }

        return {
            exists: true,
            expiresAt: new Date(reservation.expires_at),
            items: JSON.parse(reservation.items)
        };
    } catch (error) {
        console.error('Error getting reservation status:', error);
        return { exists: false };
    }
}
