import { NextResponse } from 'next/server';
import { cleanupExpiredReservations } from '@/lib/inventory/reservation';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await cleanupExpiredReservations();

        return NextResponse.json({
            success: true,
            message: 'Cleanup completed',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Cleanup cron error:', error);
        return NextResponse.json({
            success: false,
            message: 'Cleanup failed'
        }, { status: 500 });
    }
}
