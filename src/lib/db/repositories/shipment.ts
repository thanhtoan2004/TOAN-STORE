import { db } from '../drizzle';
import { shipments, shipmentItems, orderItems } from '../schema';
import { eq, and, sql, desc } from 'drizzle-orm';

/**
 * Repository xử lý thông tin Giao hàng (Shipments).
 */

export interface Shipment {
  id: number;
  orderId: number;
  warehouseId?: number;
  trackingCode?: string;
  carrier: string;
  status: 'pending' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  shippedAt?: Date;
  createdAt: Date;
  items?: ShipmentItem[];
}

export interface ShipmentItem {
  id: number;
  shipmentId: number;
  orderItemId: number;
  quantity: number;
  productName?: string;
  sku?: string;
}

/**
 * Tạo mới một chuyến giao hàng (vận đơn).
 */
export async function createShipment(data: {
  orderId: number;
  warehouseId?: number;
  trackingCode?: string;
  carrier?: string;
  items: Array<{ orderItemId: number; quantity: number }>;
}) {
  return await db.transaction(async (tx) => {
    // 1. Tạo thông tin vận đơn chính
    const [result] = await tx.insert(shipments).values({
      orderId: data.orderId,
      warehouseId: data.warehouseId || null,
      trackingNumber: data.trackingCode || `TRK${Date.now()}`,
      carrier: data.carrier || 'manual',
      status: 'pending',
    });

    const shipmentId = result.insertId;

    // 2. Thêm danh sách item vào vận đơn
    for (const item of data.items) {
      // Kiểm tra Logic
      const [row] = await tx
        .select({
          quantity: orderItems.quantity,
          shippedQuantity: sql<number>`(SELECT COALESCE(SUM(${shipmentItems.quantity}), 0) FROM ${shipmentItems} WHERE ${shipmentItems.orderItemId} = ${orderItems.id})`,
        })
        .from(orderItems)
        .where(eq(orderItems.id, item.orderItemId))
        .limit(1);

      if (!row) {
        throw new Error(`Item ${item.orderItemId} không tồn tại trong đơn hàng`);
      }

      const remaining = Number(row.quantity) - Number(row.shippedQuantity);

      if (item.quantity > remaining) {
        throw new Error(
          `Không thể giao ${item.quantity} sản phẩm. Chỉ còn ${remaining} sản phẩm chưa giao.`
        );
      }

      await tx.insert(shipmentItems).values({
        shipmentId,
        orderItemId: item.orderItemId,
        quantity: item.quantity,
      });
    }

    return shipmentId;
  });
}

/**
 * Lấy lịch sử giao hàng của một đơn hàng.
 */
export async function getShipmentsByOrderId(orderId: number) {
  const shipmentList = await db
    .select({
      id: shipments.id,
      order_id: shipments.orderId,
      warehouse_id: shipments.warehouseId,
      tracking_code: shipments.trackingNumber,
      carrier: shipments.carrier,
      status: shipments.status,
      estimated_delivery: shipments.estimatedDelivery,
      shipped_at: shipments.shippedAt,
      delivered_at: shipments.deliveredAt,
      created_at: shipments.createdAt,
      updated_at: shipments.updatedAt,
    })
    .from(shipments)
    .where(eq(shipments.orderId, orderId))
    .orderBy(desc(shipments.createdAt));

  if (shipmentList.length === 0) return [];

  // Lấy chi tiết từng item cho mỗi chuyến giao hàng
  return await Promise.all(
    shipmentList.map(async (shipment) => {
      const items = await db
        .select({
          id: shipmentItems.id,
          shipment_id: shipmentItems.shipmentId,
          order_item_id: shipmentItems.orderItemId,
          quantity: shipmentItems.quantity,
          product_name: orderItems.productName,
          sku: orderItems.sku,
        })
        .from(shipmentItems)
        .innerJoin(orderItems, eq(shipmentItems.orderItemId, orderItems.id))
        .where(eq(shipmentItems.shipmentId, shipment.id));

      return { ...shipment, items };
    })
  );
}

/**
 * Cập nhật trạng thái vận đơn.
 */
export async function updateShipmentStatus(
  shipmentId: number,
  status: 'pending' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
) {
  const updateData: any = { status };
  if (status === 'shipped') {
    updateData.shippedAt = new Date();
  }

  await db.update(shipments).set(updateData).where(eq(shipments.id, shipmentId));
}
