import { NextRequest, NextResponse } from 'next/server';
import {
    createSupportChat,
    getUserActiveChat,
    getGuestActiveChat
} from '@/lib/db/supportChat';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, guestEmail, guestName, initialMessage } = body;

        // Validation
        if (!userId && (!guestEmail || !guestName)) {
            return NextResponse.json({
                success: false,
                error: 'User ID or guest information is required'
            }, { status: 400 });
        }

        // Check if user already has an active chat
        let existingChat;
        if (userId) {
            existingChat = await getUserActiveChat(userId);
        } else if (guestEmail) {
            existingChat = await getGuestActiveChat(guestEmail);
        }

        if (existingChat) {
            return NextResponse.json({
                success: true,
                chatId: existingChat.id,
                status: existingChat.status,
                message: 'Resumed existing chat session'
            });
        }

        // Create new chat
        const chatId = await createSupportChat({
            userId,
            guestEmail,
            guestName,
            initialMessage
        });

        return NextResponse.json({
            success: true,
            chatId,
            status: 'waiting',
            message: 'Chat session created'
        });

    } catch (error) {
        console.error('Start chat error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to start chat'
        }, { status: 500 });
    }
}
