import { executeQuery, pool } from '../connection';

/**
 * Repository xử lý thông tin Giao hàng (Shipments).
 * Quản lý việc tạo vận đơn, cập nhật mã vận đơn (Tracking Code) và trạng thái vận chuyển.
 */

export interface Shipment {
  id: number;
  order_id: number;
  warehouse_id?: number;
  tracking_code?: string;
  carrier: string;
  status: 'pending' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  shipped_at?: Date;
  created_at: Date;
  items?: ShipmentItem[];
}

export interface ShipmentItem {
  id: number;
  shipment_id: number;
  order_item_id: number;
  quantity: number;
  product_name?: string; // Enriched detail
  sku?: string; // Enriched detail
}

/**
 * Tạo mới một chuyến giao hàng (vận đơn).
 * Quy trình:
 * 1. Tạo bản ghi chính trong bảng `shipments`.
 * 2. Kiểm tra số lượng còn lại của từng item trong đơn hàng (tránh giao vượt số lượng khách đặt).
 * 3. Lưu chi tiết các item vào bảng `shipment_items`.
 */
export async function createShipment(data: {
  orderId: number;
  warehouseId?: number;
  trackingCode?: string;
  carrier?: string;
  items: Array<{ orderItemId: number; quantity: number }>;
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Tạo thông tin vận đơn chính
    const [result]: any = await connection.execute(
      `INSERT INTO shipments (order_id, warehouse_id, tracking_code, carrier, status, created_at)
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [
        data.orderId,
        data.warehouseId || null,
        data.trackingCode || `TRK${Date.now()}`,
        data.carrier || 'manual',
      ]
    );

    const shipmentId = result.insertId;

    // 2. Thêm danh sách item vào vận đơn
    for (const item of data.items) {
      // Kiểm tra Logic: Không được giao quá số lượng đã đặt trừ đi số lượng đã giao trước đó
      const [rows]: any = await connection.execute(
        `SELECT oi.quantity, COALESCE(SUM(si.quantity), 0) as shipped_quantity
                 FROM order_items oi
                 LEFT JOIN shipment_items si ON oi.id = si.order_item_id
                 WHERE oi.id = ?
                 GROUP BY oi.id`,
        [item.orderItemId]
      );

      if (rows.length === 0) {
        throw new Error(`Item ${item.orderItemId} không tồn tại trong đơn hàng`);
      }

      const { quantity, shipped_quantity } = rows[0];
      const remaining = quantity - shipped_quantity;

      if (item.quantity > remaining) {
        throw new Error(
          `Không thể giao ${item.quantity} sản phẩm. Chỉ còn ${remaining} sản phẩm chưa giao.`
        );
      }

      await connection.execute(
        `INSERT INTO shipment_items (shipment_id, order_item_id, quantity)
                 VALUES (?, ?, ?)`,
        [shipmentId, item.orderItemId, item.quantity]
      );
    }

    await connection.commit();
    return shipmentId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Lấy lịch sử giao hàng của một đơn hàng.
 * Bao gồm cả thông tin sản phẩm và SKU trong từng chuyến giao.
 */
export async function getShipmentsByOrderId(orderId: number) {
  const shipments = await executeQuery<Shipment[]>(
    `SELECT * FROM shipments WHERE order_id = ? ORDER BY created_at DESC`,
    [orderId]
  );

  if (shipments.length === 0) return [];

  // Lấy chi tiết từng item cho mỗi chuyến giao hàng
  const enrichedShipments = await Promise.all(
    shipments.map(async (shipment) => {
      const items = await executeQuery<ShipmentItem[]>(
        `SELECT si.*, oi.product_name, oi.sku 
             FROM shipment_items si
             JOIN order_items oi ON si.order_item_id = oi.id
             WHERE si.shipment_id = ?`,
        [shipment.id]
      );
      return { ...shipment, items };
    })
  );

  return enrichedShipments;
}

/**
 * Cập nhật trạng thái vận đơn.
 * Nếu chuyển sang 'shipped', hệ thống sẽ tự động gán mốc thời gian `shipped_at`.
 */
export async function updateShipmentStatus(
  shipmentId: number,
  status: 'pending' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
) {
  const updateTime = status === 'shipped' ? ', shipped_at = NOW()' : '';
  await executeQuery(`UPDATE shipments SET status = ? ${updateTime} WHERE id = ?`, [
    status,
    shipmentId,
  ]);
}
