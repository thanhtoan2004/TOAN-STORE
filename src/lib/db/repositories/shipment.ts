import { executeQuery, pool } from '../connection';

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
    sku?: string;          // Enriched detail
}

/**
 * Create a new shipment for an order
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

        // 1. Create Shipment
        const [result]: any = await connection.execute(
            `INSERT INTO shipments (order_id, warehouse_id, tracking_code, carrier, status, created_at)
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
            [
                data.orderId,
                data.warehouseId || null,
                data.trackingCode || `TRK${Date.now()}`,
                data.carrier || 'manual'
            ]
        );

        const shipmentId = result.insertId;

        // 2. Add Shipment Items
        for (const item of data.items) {
            // Validate: check remaining quantity
            const [rows]: any = await connection.execute(
                `SELECT oi.quantity, COALESCE(SUM(si.quantity), 0) as shipped_quantity
                 FROM order_items oi
                 LEFT JOIN shipment_items si ON oi.id = si.order_item_id
                 WHERE oi.id = ?
                 GROUP BY oi.id`,
                [item.orderItemId]
            );

            if (rows.length === 0) {
                throw new Error(`Order item ${item.orderItemId} not found`);
            }

            const { quantity, shipped_quantity } = rows[0];
            const remaining = quantity - shipped_quantity;

            if (item.quantity > remaining) {
                throw new Error(`Cannot ship ${item.quantity} units. Only ${remaining} units remaining for this item.`);
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
 * Get all shipments for an order
 */
export async function getShipmentsByOrderId(orderId: number) {
    const shipments = await executeQuery<Shipment[]>(
        `SELECT * FROM shipments WHERE order_id = ? ORDER BY created_at DESC`,
        [orderId]
    );

    if (shipments.length === 0) return [];

    // Enrich with items
    const enrichedShipments = await Promise.all(shipments.map(async (shipment) => {
        const items = await executeQuery<ShipmentItem[]>(
            `SELECT si.*, oi.product_name, oi.sku 
             FROM shipment_items si
             JOIN order_items oi ON si.order_item_id = oi.id
             WHERE si.shipment_id = ?`,
            [shipment.id]
        );
        return { ...shipment, items };
    }));

    return enrichedShipments;
}

/**
 * Update shipment status
 */
export async function updateShipmentStatus(
    shipmentId: number,
    status: 'pending' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
) {
    const updateTime = status === 'shipped' ? ', shipped_at = NOW()' : '';
    await executeQuery(
        `UPDATE shipments SET status = ? ${updateTime} WHERE id = ?`,
        [status, shipmentId]
    );
}
