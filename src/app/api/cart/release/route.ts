import { NextRequest, NextResponse } from 'next/server';
import { releaseStock } from '@/lib/inventory/reservation';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({
                success: false,
                message: 'Session ID là bắt buộc'
            }, { status: 400 });
        }

        const result = await releaseStock(sessionId);

        return NextResponse.json({
            success: result.success,
            message: result.success ? 'Đã giải phóng sản phẩm' : 'Lỗi khi giải phóng sản phẩm'
        });

    } catch (error) {
        console.error('Release stock API error:', error);
        return NextResponse.json({
            success: false,
            message: 'Lỗi server khi giải phóng sản phẩm'
        }, { status: 500 });
    }
}
