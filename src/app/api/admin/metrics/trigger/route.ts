import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { ResponseWrapper } from '@/lib/api-response';
import { aggregateDailyMetrics } from '@/lib/cron/revenue-aggregation';

export async function POST(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) return ResponseWrapper.unauthorized();

        const body = await request.json();
        const { startDate, endDate } = body;

        if (!startDate) {
            return ResponseWrapper.error('Start date is required', 400);
        }

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(startDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return ResponseWrapper.error('Invalid date format', 400);
        }

        const result = await aggregateDailyMetrics(start, end);

        return ResponseWrapper.success(result, 'Metrics aggregation completed successfully');
    } catch (error) {
        console.error('Error triggering aggregation:', error);
        return ResponseWrapper.serverError('Failed to trigger aggregation', error);
    }
}
