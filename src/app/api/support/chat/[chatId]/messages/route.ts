import { NextRequest, NextResponse } from 'next/server';
import {
    getSupportChat,
    getSupportMessages,
    createSupportMessage,
    markMessagesAsRead
} from '@/lib/db/supportChat';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId: chatIdStr } = await params;
        const chatId = parseInt(chatIdStr);
        const { searchParams } = new URL(request.url);
        const since = searchParams.get('since');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Get chat to verify it exists
        const chat = await getSupportChat(chatId);
        if (!chat) {
            return NextResponse.json({
                success: false,
                error: 'Chat not found'
            }, { status: 404 });
        }

        // Get messages
        const messages = await getSupportMessages(chatId, {
            since: since ? new Date(since) : undefined,
            limit
        });

        // Mark admin messages as read
        await markMessagesAsRead(chatId, 'admin');

        return NextResponse.json({
            success: true,
            messages,
            chatStatus: chat.status
        });

    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to get messages'
        }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId: chatIdStr } = await params;
        const chatId = parseInt(chatIdStr);
        const body = await request.json();
        const { message, userId, imageUrl } = body;

        if ((!message || !message.trim()) && !imageUrl) {
            return NextResponse.json({
                success: false,
                error: 'Message or image is required'
            }, { status: 400 });
        }

        // Verify chat exists
        const chat = await getSupportChat(chatId);
        if (!chat) {
            return NextResponse.json({
                success: false,
                error: 'Chat not found'
            }, { status: 404 });
        }

        // Create message
        const messageId = await createSupportMessage({
            chatId,
            senderType: 'customer',
            senderId: userId,
            message: message?.trim() || '',
            imageUrl
        });

        return NextResponse.json({
            success: true,
            messageId
        });

    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to send message'
        }, { status: 500 });
    }
}
