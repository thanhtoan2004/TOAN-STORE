import { NextRequest, NextResponse } from 'next/server';
import { getAdminChats } from '@/lib/db/supportChat';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const { chats, total } = await getAdminChats({
            status,
            page,
            limit
        });

        return NextResponse.json({
            success: true,
            chats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get admin chats error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to get chats'
        }, { status: 500 });
    }
}
