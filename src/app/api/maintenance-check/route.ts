import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function GET() {
    try {
        const result: any = await executeQuery(
            "SELECT value FROM settings WHERE `key` = 'maintenance_mode' LIMIT 1"
        );

        const isMaintenance = result.length > 0 && (result[0].value === 'true' || result[0].value === '1');

        return NextResponse.json({
            maintenance: isMaintenance
        });
    } catch (error) {
        // If can't check, assume maintenance is off
        return NextResponse.json({
            maintenance: false
        });
    }
}
