import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
    try {
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
