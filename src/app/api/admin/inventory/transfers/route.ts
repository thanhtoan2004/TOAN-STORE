import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { ResponseWrapper } from '@/lib/api-response';
import { InventoryRepository } from '@/lib/db/repositories/inventory';

export async function GET(req: NextRequest) {
    try {
        const auth = await checkAdminAuth();
        if (!auth) return ResponseWrapper.unauthorized();

        const transfers = await InventoryRepository.getTransfers();
        return ResponseWrapper.success({ transfers });
    } catch (error: any) {
        return ResponseWrapper.serverError(error.message);
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await checkAdminAuth();
        if (!auth) return ResponseWrapper.unauthorized();

        const body = await req.json();
        const { fromWarehouseId, toWarehouseId, productVariantId, quantity, notes } = body;

        if (!fromWarehouseId || !toWarehouseId || !productVariantId || !quantity) {
            return ResponseWrapper.error('Missing required fields', 400);
        }

        if (fromWarehouseId === toWarehouseId) {
            return ResponseWrapper.error('Source and destination warehouses must be different', 400);
        }

        const transferId = await InventoryRepository.createTransferRequest({
            fromWarehouseId,
            toWarehouseId,
            productVariantId,
            quantity,
            notes,
            requestedBy: auth.userId
        });

        return ResponseWrapper.success({ transferId }, 'Transfer request created', 201);
    } catch (error: any) {
        return ResponseWrapper.serverError(error.message);
    }
}
