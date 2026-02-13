import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { createShipment } from '@/lib/db/repositories/shipment';
import { logAdminAction } from '@/lib/audit';

/**
 * POST - Create a new shipment (Fulfillment)
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, warehouseId, trackingCode, carrier, items } = body;

        if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
        }

        const shipmentId = await createShipment({
            orderId,
            warehouseId,
            trackingCode,
            carrier,
            items
        });

        // Log audit
        await logAdminAction(admin.userId, 'create_shipment', 'shipments', shipmentId, { orderId, items }, request as any);

        return NextResponse.json({
            success: true,
            message: 'Shipment created successfully',
            data: { shipmentId }
        });
    } catch (error: any) {
        console.error('Create shipment error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
    }
}
