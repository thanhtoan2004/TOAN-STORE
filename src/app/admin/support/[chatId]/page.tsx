'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Send,
    User,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Loader2,
    Calendar,
    Mail,
    MoreVertical,
    Paperclip,
    X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { formatDateTime } from '@/lib/date-utils';

interface Message {
    id: number;
    sender_type: 'customer' | 'admin';
    message: string;
    image_url?: string;
    created_at: string;
    sender_first_name?: string;
    sender_last_name?: string;
    is_read: boolean;
}

interface ChatDetails {
    id: number;
    user_id: number | null;
    guest_email: string | null;
    guest_name: string | null;
    status: 'waiting' | 'active' | 'resolved' | 'closed';
    created_at: string;
    updated_at: string;
    user_email?: string;
    user_first_name?: string;
    user_last_name?: string;
    assigned_admin_id?: number;
    admin_first_name?: string;
    admin_last_name?: string;
}

export default function AdminChatDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const chatId = params.chatId as string;

    const [chat, setChat] = useState<ChatDetails | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
                return;
            }
            setSelectedFile(file);
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                return data.imageUrl;
            }
        } catch (error) {
            console.error('Upload failed:', error);
        }
        return null;
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load initial chat data
    useEffect(() => {
        const loadChatData = async () => {
            try {
                // Get chat details (using existing API which might need adjustment or new endpoint)
                // Actually we can reuse getMessages endpoint which returns chatStatus
                // But we need full details. Let's try to get messages first.

                // Fetch messages
                const msgRes = await fetch(`/api/support/chat/${chatId}/messages`);
                const msgData = await msgRes.json();

                if (msgData.success) {
                    setMessages(msgData.messages);
                }

                // Since we don't have a direct "get single chat" endpoint for admin usage efficiently exposed 
                // (actually supportChat.ts has getSupportChat but no specific API route for it explicitly public for page load details besides messages)
                // We will rely on what we have or maybe we need to create one?
                // Wait, /api/admin/support/chats/[chatId] is for ACTIONS.
                // Let's assume we fetch from messages and maybe list api? 

                // Actually, let's fetch the list filtered by ID to get details, or better:
                // We should probably invoke a server action or API.
                // For now, let's use the list endpoint with a trick or just display basic info from messages if possible.
                // BETTER: Create a specific GET endpoint for chat details if needed.
                // BUT: logic reuse -> /api/support/chat/[chatId]/messages returns messages and status.
                // To get full user info, we might need to look at the first message or the updated API.

                // Let's check if we can get details from /api/admin/support/chats (list) ? No, it's paginated.

                // Let's rely on /api/admin/support/chats/[chatId] POST action? No.

                // I will add a GET method to /api/admin/support/chats/[chatId]/route.ts quickly later if needed.
                // For now, let's try to fetch messages and infer content.

                // Actually, I'll update the component to fetch from a new endpoint or update existing one.
                // Let's implement getting chat details via a new server action or API.
                // Let's try to add GET to /api/admin/support/chats/[chatId]/route.ts FIRST.

                // But first, let's finish the page skeleton.

                // Temporary: fetch from list and find (inefficient but works for now if list is small, otherwise bad)
                // Better: fetch `/api/admin/support/chats` (all) and filter? No.

                // Let's assume I will add GET /api/admin/support/chats/[chatId] 
                const res = await fetch(`/api/admin/support/chats/${chatId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setChat(data.chat);
                    }
                }

            } catch (error) {
                console.error('Error loading chat:', error);
            } finally {
                setLoading(false);
            }
        };

        loadChatData();
    }, [chatId]);

    const socketRef = useRef<any>(null);

    // Socket.io Connection
    useEffect(() => {
        if (!chatId || chat?.status === 'closed') return;

        const socketInitializer = async () => {
            await fetch('/api/socket');
            const { io } = await import('socket.io-client');

            socketRef.current = io({
                path: '/api/socket'
            });

            socketRef.current.on('connect', () => {
                console.log('Admin socket connected');
                socketRef.current.emit('join-chat', chatId);
            });

            socketRef.current.on('new-message', (data: Message) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === data.id)) return prev;
                    return [...prev, data];
                });
            });

            // Additionally, refresh chat details on message to ensure status/assignment sync
            socketRef.current.on('chat-updated', async () => {
                const res = await fetch(`/api/admin/support/chats/${chatId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.chat) setChat(data.chat);
                }
            });
        };

        socketInitializer();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [chatId, chat?.status]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && !selectedFile) || sending || !user) return;

        setSending(true);
        const messageText = inputValue.trim();
        const fileToSend = selectedFile;

        setInputValue('');
        setSelectedFile(null);

        try {
            let imageUrl = undefined;
            if (fileToSend) {
                const url = await uploadImage(fileToSend);
                if (url) imageUrl = url;
            }

            const res = await fetch(`/api/admin/support/chats/${chatId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_message',
                    adminId: user.id,
                    message: messageText,
                    imageUrl
                })
            });

            const data = await res.json();
            if (data.success) {
                // Optimistic update
                const newMsg: Message = {
                    id: data.messageId,
                    sender_type: 'admin',
                    message: messageText,
                    image_url: imageUrl,
                    created_at: new Date().toISOString(),
                    is_read: false, // Sent mostly
                    sender_first_name: user.firstName,
                    sender_last_name: user.lastName
                };
                setMessages(prev => [...prev, newMsg]);

                // NEW: Emit via socket
                if (socketRef.current) {
                    socketRef.current.emit('send-message', {
                        chatId,
                        ...newMsg
                    });
                }
            }
        } catch (error) {
            console.error('Send failed:', error);
            setInputValue(messageText);
            setSelectedFile(fileToSend);
        } finally {
            setSending(false);
        }
    };

    const handleAction = async (action: 'assign' | 'resolve') => {
        if (!user) return;
        try {
            const res = await fetch(`/api/admin/support/chats/${chatId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    adminId: user.id // For assign
                })
            });
            const data = await res.json();
            if (data.success) {
                // Refresh chat details
                const detailsRes = await fetch(`/api/admin/support/chats/${chatId}`);
                if (detailsRes.ok) {
                    const d = await detailsRes.json();
                    setChat(d.chat);
                }
            }
        } catch (error) {
            console.error('Action failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="p-8 text-center text-gray-500">
                Không tìm thấy cuộc trò chuyện.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/admin/support" className="text-gray-500 hover:text-black">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            {chat.user_first_name ? `${chat.user_first_name} ${chat.user_last_name}` : (chat.guest_name || 'Khách')}
                            {chat.guest_email && <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">Guest</span>}
                        </h1>
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <Mail size={12} />
                                {chat.user_email || chat.guest_email}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatDateTime(chat.created_at)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${chat.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                            chat.status === 'waiting' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {chat.status === 'active' ? 'Đang hoạt động' :
                            chat.status === 'waiting' ? 'Đang chờ' :
                                chat.status === 'resolved' ? 'Đã giải quyết' : 'Đã đóng'}
                    </div>

                    {chat.status !== 'resolved' && chat.status !== 'closed' && (
                        <>
                            {chat.assigned_admin_id !== user?.id ? (
                                <button
                                    onClick={() => handleAction('assign')}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                                >
                                    Tiếp nhận
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleAction('resolve')}
                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                                >
                                    Hoàn thành
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex flex-col ${msg.sender_type === 'admin' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                            <div className="text-xs text-gray-400 mb-1 px-1">
                                {msg.sender_type === 'admin'
                                    ? 'Bạn'
                                    : (chat.user_first_name || chat.guest_name || 'Khách')} • {formatDateTime(msg.created_at)}
                            </div>
                            <div
                                className={`px-4 py-3 rounded-2xl text-sm ${msg.sender_type === 'admin'
                                    ? 'bg-black text-white rounded-tr-sm'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                                    }`}
                            >
                                {msg.image_url && (
                                    <div className="mb-2">
                                        <img
                                            src={msg.image_url}
                                            alt="Attachment"
                                            className="max-w-full rounded-lg max-h-64 object-cover border border-gray-200 bg-white"
                                        />
                                    </div>
                                )}
                                {msg.message && <div>{msg.message}</div>}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {chat.status !== 'resolved' && chat.status !== 'closed' && (
                <div className="bg-white border-t p-4 shrink-0">
                    {selectedFile && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg text-xs w-fit mx-auto max-w-4xl">
                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                            <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="text-gray-500 hover:text-black"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={sending || chat.assigned_admin_id !== user?.id}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                            disabled={sending || chat.assigned_admin_id !== user?.id}
                            title="Gửi ảnh"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={chat.assigned_admin_id === user?.id ? "Nhập tin nhắn..." : "Vui lòng tiếp nhận cuộc trò chuyện để trả lời"}
                            disabled={sending || chat.assigned_admin_id !== user?.id}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />
                        <button
                            type="submit"
                            disabled={sending || (!inputValue.trim() && !selectedFile) || chat.assigned_admin_id !== user?.id}
                            className="px-6 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                    {chat.assigned_admin_id !== user?.id && (
                        <p className="text-center text-xs text-red-500 mt-2">
                            * Bạn cần tiếp nhận cuộc trò chuyện này để trả lời
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
