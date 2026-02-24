
import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { updateRefundStatus, getRefundById } from '@/lib/db/repositories/refund';

/**
 * API Lấy chi tiết yêu cầu hoàn tiền.
 */
export async function GET(
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
        const refund = await getRefundById(id);

        if (!refund) {
            return NextResponse.json({ message: 'Refund request not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: refund });

    } catch (error: any) {
        console.error('Admin Get Refund Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

/**
 * API Phê duyệt hoặc Từ chối yêu cầu hoàn tiền.
 * Yêu cầu gửi kèm trạng thái (`approved` hoặc `rejected`) và phản hồi cho khách hàng.
 */
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
