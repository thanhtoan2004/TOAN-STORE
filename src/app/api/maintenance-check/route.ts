import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { getCache, setCache } from '@/lib/cache';

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
            return NextResponse.json({
                maintenance: cachedStatus,
                cached: true
            });
        }

        // 2. Fallback to Database
        const result: any = await executeQuery(
            "SELECT value FROM settings WHERE `key` = 'maintenance_mode' LIMIT 1"
        );

        const isMaintenance = result.length > 0 && (result[0].value === 'true' || result[0].value === '1');

        // 3. Save to cache
        await setCache(MAINTENANCE_CACHE_KEY, isMaintenance, CACHE_TTL);

        return NextResponse.json({
            maintenance: isMaintenance,
            cached: false
        });
    } catch (error) {
        // If can't check, assume maintenance is off
        console.error('Maintenance Check Error:', error);
        return NextResponse.json({
            maintenance: false
        });
    }
}
