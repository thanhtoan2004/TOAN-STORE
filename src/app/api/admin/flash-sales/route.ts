import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { invalidateCache } from '@/lib/cache';
import { checkAdminAuth } from '@/lib/auth';
import { formatDateForMySQL } from '@/lib/date-utils';
import { logAdminAction } from '@/lib/audit';

/**
 * GET - List all flash sales for admin
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const flashSales = await executeQuery<any[]>(
            `SELECT * FROM flash_sales WHERE deleted_at IS NULL ORDER BY created_at DESC`
        );

        return NextResponse.json({
            success: true,
            data: flashSales
        });
    } catch (error) {
        console.error('List flash sales error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST - Create matching flash sale
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, startTime, endTime, isActive } = body;

        if (!name || !startTime || !endTime) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        if (new Date(startTime) >= new Date(endTime)) {
            return NextResponse.json({ success: false, message: 'End time must be after start time' }, { status: 400 });
        }

        const result: any = await executeQuery(
            `INSERT INTO flash_sales (name, description, start_time, end_time, is_active)
       VALUES (?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                formatDateForMySQL(startTime),
                formatDateForMySQL(endTime),
                isActive !== undefined ? isActive : 1
            ]
        );

        // Log audit
        await logAdminAction(admin.userId, 'create_flash_sale', 'flash_sales', result.insertId, { name }, request as any);

        // Invalidate active flash sale cache
        await invalidateCache('flash-sale:active');

        return NextResponse.json({
            success: true,
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create flash sale error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
