import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { getRedisConnection } from '@/lib/redis/redis';

/**
 * API Kiểm tra sức khỏe hệ thống (Health Check).
 * Thực hiện kiểm tra kết nối tới:
 * 1. Database (MySQL).
 * 2. Caching Layer (Redis).
 * Trả về mã lỗi 503 nếu một trong các dịch vụ cốt lõi gặp sự cố.
 */
export async function GET() {
  const status = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
    ok: false,
  };

  try {
    // 1. Check Database
    await executeQuery('SELECT 1');
    status.services.database = 'healthy';
  } catch (error) {
    console.error('Health Check - Database Error:', error);
    status.services.database = 'unhealthy';
  }

  try {
    // 2. Check Redis
    const redis = getRedisConnection();
    await redis.ping();
    status.services.redis = 'healthy';
  } catch (error) {
    console.error('Health Check - Redis Error:', error);
    status.services.redis = 'unhealthy';
  }

  // 3. Overall Status
  status.ok = status.services.database === 'healthy' && status.services.redis === 'healthy';

  const httpStatus = status.ok ? 200 : 503;

  return NextResponse.json(status, { status: httpStatus });
}
