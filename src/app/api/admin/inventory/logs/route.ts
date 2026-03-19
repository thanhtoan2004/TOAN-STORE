import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';
import { getInventoryLogs } from '@/lib/db/repositories/inventory';

/**
 * API Lấy nhật ký biến động kho (Audit Logs).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth) return ResponseWrapper.unauthorized();

    const { searchParams } = new URL(req.url);
    const inventoryId = searchParams.get('inventoryId')
      ? parseInt(searchParams.get('inventoryId')!)
      : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await getInventoryLogs({
      inventoryId,
      page,
      limit,
    });

    return ResponseWrapper.success(logs);
  } catch (error: any) {
    console.error('[API_INVENTORY_LOGS_GET] Error:', error);
    return ResponseWrapper.serverError(error.message);
  }
}
