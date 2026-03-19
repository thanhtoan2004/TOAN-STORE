import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { settings as settingsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCache, setCache } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

const MAINTENANCE_CACHE_KEY = 'settings:maintenance_mode';
const CACHE_TTL = 3600; // 1 hour

/**
 * API Kiểm tra trạng thái bảo trì của hệ thống.
 * Trả về `maintenance: true` nếu trang web đang được quản trị viên đưa vào chế độ bảo trì.
 */
export async function GET() {
  try {
    // 1. Try to get from cache first
    const cachedStatus = await getCache<boolean>(MAINTENANCE_CACHE_KEY);
    if (cachedStatus !== null) {
      return ResponseWrapper.success(
        {
          maintenance: cachedStatus,
        },
        undefined,
        200,
        { cached: true }
      );
    }

    // 2. Fallback to Database using Drizzle
    const [row] = await db
      .select({ value: settingsTable.value })
      .from(settingsTable)
      .where(eq(settingsTable.key, 'maintenance_mode'))
      .limit(1);

    const isMaintenance = row && (row.value === 'true' || row.value === '1');

    // 3. Save to cache
    await setCache(MAINTENANCE_CACHE_KEY, !!isMaintenance, CACHE_TTL);

    return ResponseWrapper.success(
      {
        maintenance: !!isMaintenance,
      },
      undefined,
      200,
      { cached: false }
    );
  } catch (error) {
    // If can't check, assume maintenance is off
    console.error('Maintenance Check Error:', error);
    return ResponseWrapper.success(
      {
        maintenance: false,
      },
      'Maintenance Check Error - Defaulting to false'
    );
  }
}
