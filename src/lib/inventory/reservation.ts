import { query, pool } from '@/lib/db/mysql';

async function getRawConnection() {
  return await pool.getConnection();
}

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
  const connection = await getRawConnection();
  try {
    await connection.beginTransaction();

    // Check if there's enough stock for all items
    for (const item of items) {
      const [inventoryRows]: any = await connection.execute(
        `SELECT quantity, reserved FROM inventory WHERE product_variant_id = ? FOR UPDATE`, // Lock rows for consistency
        [item.productVariantId]
      );
      const inventory = inventoryRows[0];

      if (!inventory) {
        await connection.rollback();
        return {
          success: false,
          message: `Sản phẩm không tồn tại trong kho`,
        };
      }

      const available = inventory.quantity - inventory.reserved;
      if (available < item.quantity) {
        await connection.rollback();
        return {
          success: false,
          message: `Không đủ hàng trong kho. Chỉ còn ${available} sản phẩm`,
        };
      }
    }

    // Reserve stock by updating the reserved field
    for (const item of items) {
      await connection.execute(
        `UPDATE inventory 
         SET reserved = reserved + ? 
         WHERE product_variant_id = ?`,
        [item.quantity, item.productVariantId]
      );
    }

    // Store reservation info (you might want to create a reservations table)
    // For now, we'll use a simple approach with session storage
    const expiresAt = new Date(Date.now() + RESERVATION_TIMEOUT);

    // Insert parent reservation (or update expiration if duplicate session)
    await connection.execute(
      `INSERT INTO stock_reservations (session_id, expires_at, created_at)
             VALUES (?, ?, NOW())
             ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
      [sessionId, expiresAt]
    );

    // Fetch the generated/updated ID
    const [rows]: any = await connection.execute(
      `SELECT id FROM stock_reservations WHERE session_id = ?`,
      [sessionId]
    );
    const reservationId = rows[0]?.id;

    if (reservationId) {
      // Wipe old items if any (cart logic)
      await connection.execute(`DELETE FROM stock_reservation_items WHERE reservation_id = ?`, [
        reservationId,
      ]);

      // Insert mapped items
      for (const item of items) {
        await connection.execute(
          `INSERT INTO stock_reservation_items (reservation_id, product_variant_id, quantity)
                     VALUES (?, ?, ?)`,
          [reservationId, item.productVariantId, item.quantity]
        );
      }
    }

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error('Error reserving stock:', error);
    return {
      success: false,
      message: 'Lỗi khi đặt chỗ sản phẩm',
    };
  } finally {
    connection.release();
  }
}

/**
 * Release reserved stock
 * Giải phóng stock đã reserve khi user hủy hoặc timeout
 */
export async function releaseStock(sessionId: string): Promise<{ success: boolean }> {
  const connection = await getRawConnection();
  try {
    await connection.beginTransaction();

    // Get reservation info
    const [reservationRows]: any = await connection.execute(
      `SELECT sr.id, sri.product_variant_id as productVariantId, sri.quantity
             FROM stock_reservations sr
             JOIN stock_reservation_items sri ON sr.id = sri.reservation_id
             WHERE sr.session_id = ? FOR UPDATE`, // Lock reservation and its items
      [sessionId]
    );

    if (reservationRows.length === 0) {
      await connection.commit(); // No reservation to release
      return { success: true };
    }

    const reservationId = reservationRows[0].id;
    const items: ReservationItem[] = reservationRows.map((row: any) => ({
      productVariantId: row.productVariantId,
      quantity: row.quantity,
    }));

    // Release stock
    for (const item of items) {
      await connection.execute(
        `UPDATE inventory 
         SET reserved = GREATEST(0, reserved - ?) 
         WHERE product_variant_id = ?`,
        [item.quantity, item.productVariantId]
      );
    }

    // Delete reservation record and its items
    await connection.execute(`DELETE FROM stock_reservation_items WHERE reservation_id = ?`, [
      reservationId,
    ]);
    await connection.execute(`DELETE FROM stock_reservations WHERE id = ?`, [reservationId]);

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error('Error releasing stock:', error);
    return { success: false };
  } finally {
    connection.release();
  }
}

/**
 * Confirm stock (deduct from inventory after successful order)
 * Trừ stock thực tế sau khi order thành công
 */
export async function confirmStock(
  sessionId: string
): Promise<{ success: boolean; message?: string }> {
  const connection = await getRawConnection();
  try {
    await connection.beginTransaction();

    // Get reservation info
    const [reservationRows]: any = await connection.execute(
      `SELECT sr.id, sri.product_variant_id as productVariantId, sri.quantity 
             FROM stock_reservations sr
             JOIN stock_reservation_items sri ON sr.id = sri.reservation_id
             WHERE sr.session_id = ? FOR UPDATE`, // Lock reservation and its items
      [sessionId]
    );

    if (reservationRows.length === 0) {
      await connection.rollback();
      return { success: false, message: 'Reservation not found.' };
    }

    const reservationId = reservationRows[0].id;
    const items: ReservationItem[] = reservationRows.map((row: any) => ({
      productVariantId: row.productVariantId,
      quantity: row.quantity,
    }));

    // Deduct from quantity and reserved
    for (const item of items) {
      await connection.execute(
        `UPDATE inventory 
         SET quantity = GREATEST(0, quantity - ?),
             reserved = GREATEST(0, reserved - ?)
         WHERE product_variant_id = ?`,
        [item.quantity, item.quantity, item.productVariantId]
      );

      // Log inventory change
      await connection.execute(
        `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id, created_at)
         SELECT id, ?, 'order_confirmed', ?, NOW()
         FROM inventory
         WHERE product_variant_id = ?`,
        [-item.quantity, sessionId, item.productVariantId]
      );
    }

    // Delete reservation record and its items
    await connection.execute(`DELETE FROM stock_reservation_items WHERE reservation_id = ?`, [
      reservationId,
    ]);
    await connection.execute(`DELETE FROM stock_reservations WHERE id = ?`, [reservationId]);

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error('Error confirming stock:', error);
    return { success: false };
  } finally {
    connection.release();
  }
}

/**
 * Clean up expired reservations
 * Tự động giải phóng các reservation đã hết hạn
 */
export async function cleanupExpiredReservations(): Promise<void> {
  const connection = await getRawConnection();
  try {
    await connection.beginTransaction();

    // Find expired parent IDs and their items
    const [rows]: any = await connection.execute(
      `SELECT sr.id as reservationId, sri.product_variant_id as productVariantId, sri.quantity
             FROM stock_reservations sr
             JOIN stock_reservation_items sri ON sr.id = sri.reservation_id
             WHERE sr.expires_at < NOW() FOR UPDATE` // Lock expired reservations and their items
    );

    if (rows.length === 0) {
      await connection.commit();
      console.log(`Cleaned up 0 expired reservations`);
      return; // nothing expired
    }

    const expiredReservationIds = new Set<number>();
    let releasedItemCount = 0;

    for (const row of rows) {
      expiredReservationIds.add(row.reservationId);

      if (row.productVariantId && row.quantity) {
        await connection.execute(
          `UPDATE inventory 
                     SET reserved = GREATEST(0, reserved - ?)
                     WHERE product_variant_id = ?`,
          [row.quantity, row.productVariantId]
        );
        releasedItemCount++;
      }
    }

    // Delete expired reservation items
    if (expiredReservationIds.size > 0) {
      const ids = Array.from(expiredReservationIds);
      await connection.execute(`DELETE FROM stock_reservation_items WHERE reservation_id IN (?)`, [
        ids,
      ]);
      // Delete expired reservations
      await connection.execute(`DELETE FROM stock_reservations WHERE id IN (?)`, [ids]);
    }

    await connection.commit();
    console.log(
      `Cleaned up ${expiredReservationIds.size} expired reservations with ${releasedItemCount} items`
    );
  } catch (error) {
    await connection.rollback();
    console.error('Error cleaning up expired reservations:', error);
  } finally {
    connection.release();
  }
}

/**
 * Get reservation status
 * Kiểm tra trạng thái reservation
 */
export async function getReservationStatus(
  sessionId: string
): Promise<{ exists: boolean; expiresAt?: Date; items?: ReservationItem[] }> {
  const connection = await getRawConnection();
  try {
    const [rows]: any = await connection.execute(
      `SELECT sr.expires_at, sri.product_variant_id as productVariantId, sri.quantity
             FROM stock_reservations sr
             LEFT JOIN stock_reservation_items sri ON sr.id = sri.reservation_id
             WHERE sr.session_id = ?`,
      [sessionId]
    );

    if (rows.length === 0) {
      return { exists: false };
    }

    const mappedItems = rows
      .filter((r: any) => r.productVariantId != null) // Filter out rows where there are no items (LEFT JOIN)
      .map((r: any) => ({ productVariantId: r.productVariantId, quantity: r.quantity }));

    return {
      exists: true,
      expiresAt: new Date(rows[0].expires_at),
      items: mappedItems,
    };
  } catch (error) {
    console.error('Error getting reservation status:', error);
    return { exists: false };
  } finally {
    connection.release();
  }
}
