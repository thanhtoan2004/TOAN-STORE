import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { checkAdminAuth } from '@/lib/auth';

/**
 * API Debug: Kiểm tra hệ thống giám sát lỗi (Sentry Diagnostics).
 * Kích hoạt các thông báo lỗi và log thủ công để đảm bảo Sentry đang thu thập dữ liệu đúng cách.
 * Không khả dụng ở môi trường Production.
 */
export async function GET() {
    try {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ success: false, message: 'Not Found' }, { status: 404 });
        }

        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
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

        return NextResponse.json({
            success: true,
            message: 'Sentry diagnostics triggered. Check your Sentry dashboard.',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error(error, 'Sentry Diagnostic: Unexpected Error');
        return NextResponse.json({ success: false, error: 'Failed to trigger Sentry diagnostics' }, { status: 500 });
    }
}
