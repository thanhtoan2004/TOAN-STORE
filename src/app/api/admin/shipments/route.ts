import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { createShipment } from '@/lib/db/repositories/shipment';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * POST - Create a new shipment (Fulfillment)
 */
/**
 * API Tạo vận đơn / Lô hàng (Shipment / Fulfillment).
 * Dùng khi Admin bắt đầu đóng gói và giao hàng cho đơn vị vận chuyển.
 * Hệ thống sẽ lưu Mã vận đơn (Tracking Code) và Hãng vận chuyển (Carrier).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const {
      order_id,
      orderId,
      warehouse_id,
      warehouseId,
      tracking_code,
      trackingCode,
      carrier,
      items,
    } = body;

    const finalOrderId = order_id || orderId;
    const finalWarehouseId = warehouse_id || warehouseId;
    const finalTrackingCode = tracking_code || trackingCode;

    if (!finalOrderId || !items || !Array.isArray(items) || items.length === 0) {
      return ResponseWrapper.error('Invalid data', 400);
    }

    const shipmentId = await createShipment({
      orderId: finalOrderId,
      warehouseId: finalWarehouseId,
      trackingCode: finalTrackingCode,
      carrier,
      items,
    });

    // Log audit
    await logAdminAction(
      admin.userId,
      'create_shipment',
      'shipments',
      shipmentId,
      { orderId: finalOrderId, items },
      request as any
    );

    return ResponseWrapper.success({ shipmentId }, 'Shipment created successfully', 201);
  } catch (error: any) {
    console.error('Create shipment error:', error);
    return ResponseWrapper.serverError(error.message || 'Internal server error', error);
  }
}
