import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import * as Sentry from '@sentry/nextjs';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Debug: Kiểm tra hệ thống giám sát lỗi (Sentry Diagnostics).
 * Kích hoạt các thông báo lỗi và log thủ công để đảm bảo Sentry đang thu thập dữ liệu đúng cách.
 * Chỉ khả dụng ở môi trường phát triển (Development) và yêu cầu quyền Admin.
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return ResponseWrapper.notFound();
    }

    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    // 1. Test Sentry directly
    Sentry.captureMessage('Sentry Diagnostic: Direct Message');

    // 2. Test via Logger (which should trigger Sentry)
    logger.error('Sentry Diagnostic: Message via Logger');

    // 3. Test exception via Logger
    try {
      throw new Error('Sentry Diagnostic: Direct Exception');
    } catch (e) {
      logger.error(e, 'Sentry Diagnostic: Exception via Logger');
    }

    const result = {
      timestamp: new Date().toISOString(),
    };

    return ResponseWrapper.success(
      result,
      'Sentry diagnostics triggered. Check your Sentry dashboard.'
    );
  } catch (error) {
    logger.error(error, 'Sentry Diagnostic: Unexpected Error');
    return ResponseWrapper.serverError('Failed to trigger Sentry diagnostics', error);
  }
}
