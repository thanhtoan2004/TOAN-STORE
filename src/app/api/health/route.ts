import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { getRedisConnection } from '@/lib/redis/redis';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Kiểm tra sức khỏe hệ thống (Health Check).
 * Thực hiện kiểm tra kết nối tới:
 * 1. Database (MySQL).
 * 2. Caching Layer (Redis).
 * Trả về mã lỗi 503 nếu một trong các dịch vụ cốt lõi gặp sự cố.
 */
export async function GET() {
  const services = {
    database: 'unknown',
    redis: 'unknown',
  };

  try {
    // 1. Check Database using Drizzle
    await db.execute(sql`SELECT 1`);
    services.database = 'healthy';
  } catch (error) {
    console.error('Health Check - Database Error:', error);
    services.database = 'unhealthy';
  }

  try {
    // 2. Check Redis
    const redis = getRedisConnection();
    await redis.ping();
    services.redis = 'healthy';
  } catch (error) {
    console.error('Health Check - Redis Error:', error);
    services.redis = 'unhealthy';
  }

  // 3. Overall Status
  const isOk = services.database === 'healthy' && services.redis === 'healthy';

  const data = {
    uptime: process.uptime(),
    services,
  };

  if (isOk) {
    return ResponseWrapper.success(data, 'System is healthy');
  } else {
    // Return 503 Service Unavailable if any core service is down
    return ResponseWrapper.error('Some services are unhealthy', 503, data);
  }
}
