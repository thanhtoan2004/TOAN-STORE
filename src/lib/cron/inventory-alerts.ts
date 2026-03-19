import { getLowStockAlerts, getOutOfStockItems } from '../inventory/alerts';
import { db } from '../db/drizzle';
import { securityLogs } from '../db/schema';

export async function processInventoryAlerts() {
  console.log('[INVENTORY_ALERTS] Starting inventory health check...');

  try {
    const lowStock = await getLowStockAlerts();
    const outOfStock = await getOutOfStockItems();

    const totalAlerts = lowStock.length + outOfStock.length;
    console.log(
      `[INVENTORY_ALERTS] Found ${lowStock.length} low stock items and ${outOfStock.length} out of stock items.`
    );

    if (totalAlerts > 0) {
      // Log to security_logs as a system event
      await db.insert(securityLogs).values({
        eventType: 'INVENTORY_HEALTH_CHECK',
        details: JSON.stringify({
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
          timestamp: new Date().toISOString(),
        }),
        status: 'warning',
      });
    }

    return {
      success: true,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      alerts: [...outOfStock, ...lowStock],
    };
  } catch (error) {
    console.error('[INVENTORY_ALERTS] Error during health check:', error);
    throw error;
  }
}
