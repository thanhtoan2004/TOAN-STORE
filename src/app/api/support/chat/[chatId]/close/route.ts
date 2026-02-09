import { NextRequest, NextResponse } from 'next/server';
import { getSupportChat, updateChatStatus } from '@/lib/db/supportChat';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId: chatIdStr } = await params;
        const chatId = parseInt(chatIdStr);

        // Verify chat exists
        const chat = await getSupportChat(chatId);
        if (!chat) {
            return NextResponse.json({
                success: false,
                error: 'Chat not found'
            }, { status: 404 });
        }

        // Update status to closed
        await updateChatStatus(chatId, 'closed');

        return NextResponse.json({
            success: true,
            message: 'Chat closed successfully'
        });

    } catch (error) {
        console.error('Close chat error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to close chat'
        }, { status: 500 });
    }
}
