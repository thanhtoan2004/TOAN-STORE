import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { ResponseWrapper } from '@/lib/api-response';
import { processInventoryAlerts } from '@/lib/cron/inventory-alerts';

/**
 * API Kích hoạt quét cảnh báo tồn kho (Inventory Alerts).
 * Dùng để kiểm tra các sản phẩm sắp hết hàng dựa trên ngưỡng cấu hình (Low stock threshold)
 * và chuẩn bị dữ liệu cho Dashboard/Email cảnh báo.
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await checkAdminAuth();
        if (!auth) {
            return ResponseWrapper.unauthorized();
        }

        const result = await processInventoryAlerts();
        return ResponseWrapper.success(result);
    } catch (error: any) {
        console.error('[API_INVENTORY_ALERTS] Error:', error);
        return ResponseWrapper.serverError(error.message);
    }
}
