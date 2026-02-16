import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { ResponseWrapper } from '@/lib/api-response';
import { processInventoryAlerts } from '@/lib/cron/inventory-alerts';

export async function GET(req: NextRequest) {
    try {
        const auth = await checkAdminAuth(req);
        if (!auth.isAuthenticated) {
            return ResponseWrapper.unauthorized();
        }

        const result = await processInventoryAlerts();
        return ResponseWrapper.success(result);
    } catch (error: any) {
        console.error('[API_INVENTORY_ALERTS] Error:', error);
        return ResponseWrapper.serverError(error.message);
    }
}
