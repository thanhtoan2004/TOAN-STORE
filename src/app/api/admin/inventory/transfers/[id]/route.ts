import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';
import { InventoryRepository } from '@/lib/db/repositories/inventory';

/**
 * API Phê duyệt hoặc Từ chối lệnh điều chuyển hàng hóa.
 * Logic: Khi được phê duyệt, hệ thống sẽ thực hiện trừ kho nguồn và cộng kho đích tương ứng.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth) return ResponseWrapper.unauthorized();

    const { id: paramId } = await params;
    const transferId = parseInt(paramId);
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return ResponseWrapper.error('Status is required', 400);
    }

    await InventoryRepository.processTransfer(transferId, status, auth.userId);

    return ResponseWrapper.success(null, `Transfer ${status} successfully`);
  } catch (error: any) {
    console.error('[API_INVENTORY_TRANSFER_PATCH] Error:', error);
    return ResponseWrapper.serverError(error.message);
  }
}
