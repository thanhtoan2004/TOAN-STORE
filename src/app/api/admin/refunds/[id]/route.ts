
import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { updateRefundStatus } from '@/lib/db/repositories/refund';

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(params.id);
        const body = await request.json();
        const { status, response } = body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }

        const success = await updateRefundStatus(id, status, response || '');

        if (!success) {
            return NextResponse.json({ message: 'Refund request not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Updated refund status successfully' });

    } catch (error: any) {
        console.error('Admin Update Refund Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
