"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, CheckCircle2, Clock, Paperclip, X } from 'lucide-react';

interface Message {
    id: number;
    sender_type: 'customer' | 'admin';
    message: string;
    image_url?: string;
    is_read: boolean;
    created_at: string;
    sender_first_name?: string;
    sender_last_name?: string;
}

interface LiveSupportChatProps {
    userId?: number;
    guestEmail?: string;
    guestName?: string;
}

export default function LiveSupportChat({ userId, guestEmail, guestName }: LiveSupportChatProps) {
    const [chatId, setChatId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatStatus, setChatStatus] = useState<'waiting' | 'active' | 'resolved' | 'closed'>('waiting');
    const [isInitializing, setIsInitializing] = useState(true);
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initInProgressRef = useRef<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 20 * 1024 * 1024) { // 20MB limit for general files
                alert('File quá lớn. Vui lòng chọn file nhỏ hơn 20MB.');
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

    const [guestInfo, setGuestInfo] = useState({ name: '', email: '' });
    const [showGuestForm, setShowGuestForm] = useState(!userId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize chat session
    useEffect(() => {
        if (!userId && showGuestForm) {
            setIsInitializing(false);
            return;
        }

        const initChat = async () => {
            if (initInProgressRef.current) return;
            initInProgressRef.current = true;
            setIsInitializing(true);

            const controller = new AbortController();
            const signal = controller.signal;

            try {
                // If guest, use local state data or props
                const currentGuestName = userId ? undefined : (guestName || guestInfo.name);
                const currentGuestEmail = userId ? undefined : (guestEmail || guestInfo.email);

                const response = await fetch('/api/support/chat/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        guestEmail: currentGuestEmail,
                        guestName: currentGuestName
                    }),
                    signal
                });

                const data = await response.json();
                if (data.success) {
                    setChatId(data.chatId);
                    setChatStatus(data.status);
                    // Load initial messages
                    await loadMessages(data.chatId);

                    // Pre-fill input if new chat
                    if (data.isNew || (data.messages && data.messages.length === 0)) {
                        setInputValue('Xin chào, tôi cần hỗ trợ!');
                    }

                    setShowGuestForm(false);
                }
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                console.error('Failed to initialize chat:', error);
            } finally {
                setIsInitializing(false);
                initInProgressRef.current = false;
            }
        };

        if (userId || (!showGuestForm && guestInfo.name && guestInfo.email)) {
            initChat();
        }
    }, [userId, guestEmail, guestName, showGuestForm, guestInfo.name, guestInfo.email]);

    const socketRef = useRef<any>(null);

    // Socket.io Connection
    useEffect(() => {
        if (!chatId || chatStatus === 'closed') return;

        // Initialize socket
        const socketInitializer = async () => {
            await fetch('/api/socket');
            const { io } = await import('socket.io-client');

            socketRef.current = io({
                path: '/api/socket'
            });

            socketRef.current.on('connect', () => {
                console.log('Socket connected');
                socketRef.current.emit('join-chat', chatId);
            });

            socketRef.current.on('new-message', (data: Message) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === data.id)) return prev;
                    return [...prev, data];
                });

                // If it's an admin message, emit read event if window is likely focused
                if (data.sender_type === 'admin') {
                    // Call API to persist read status
                    fetch(`/api/support/chat/${chatId}/read`, {
                        method: 'PATCH',
                        headers: { 'x-chat-token': localStorage.getItem(`chat_token_${chatId}`) || '' }
                    });
                    socketRef.current.emit('mark-read', { chatId });
                }
            });

            socketRef.current.on('user-typing', (data: any) => {
                if (data.senderType === 'admin') {
                    setIsAgentTyping(true);
                }
            });

            socketRef.current.on('user-stop-typing', (data: any) => {
                if (data.senderType === 'admin') {
                    setIsAgentTyping(false);
                }
            });

            socketRef.current.on('messages-read', () => {
                setMessages(prev => prev.map(m =>
                    m.sender_type === 'customer' ? { ...m, is_read: true } : m
                ));
            });

            socketRef.current.on('disconnect', () => {
                console.log('Socket disconnected');
            });
        };

        socketInitializer();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [chatId, chatStatus]);

    const loadMessages = async (id: number) => {
        try {
            const response = await fetch(`/api/support/chat/${id}/messages`);
            const data = await response.json();
            if (data.success) {
                setMessages(data.messages);
                setChatStatus(data.chatStatus);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && !selectedFile) || isLoading || !chatId) return;

        const messageText = inputValue.trim();
        const fileToSend = selectedFile;

        setInputValue('');
        setSelectedFile(null);
        setIsLoading(true);

        try {
            let imageUrl = undefined;
            if (fileToSend) {
                const url = await uploadImage(fileToSend);
                if (url) imageUrl = url;
            }

            const response = await fetch(`/api/support/chat/${chatId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    userId: userId || null,
                    imageUrl
                })
            });

            const data = await response.json();
            if (data.success) {
                // Add message optimistically
                const newMessage: Message = {
                    id: data.messageId,
                    sender_type: 'customer',
                    message: messageText,
                    image_url: imageUrl,
                    is_read: false,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, newMessage]);

                // NEW: Emit via socket
                if (socketRef.current) {
                    socketRef.current.emit('send-message', {
                        chatId,
                        ...newMessage
                    });
                }
            }
        } catch (error) {
            console.error('Send message error:', error);
            setInputValue(messageText);
            setSelectedFile(fileToSend);
        } finally {
            setIsLoading(false);
            if (socketRef.current) {
                socketRef.current.emit('stop-typing', { chatId, senderType: 'customer' });
            }
        }
    };

    // Typing emission
    useEffect(() => {
        if (!chatId || !inputValue.trim() || !socketRef.current) return;

        socketRef.current.emit('typing', { chatId, senderType: 'customer' });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current.emit('stop-typing', { chatId, senderType: 'customer' });
        }, 3000);

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [inputValue, chatId]);

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (guestInfo.name && guestInfo.email) {
            setShowGuestForm(false);
            // The useEffect will trigger seeing !showGuestForm and call initChat
        }
    };

    const getStatusBadge = () => {
        switch (chatStatus) {
            case 'waiting':
                return (
                    <div className="flex items-center gap-2 text-yellow-600 text-xs">
                        <Clock size={14} />
                        <span>Đang chờ hỗ trợ...</span>
                    </div>
                );
            case 'active':
                return (
                    <div className="flex items-center gap-2 text-green-600 text-xs">
                        <CheckCircle2 size={14} />
                        <span>Đã kết nối</span>
                    </div>
                );
            case 'resolved':
                return (
                    <div className="flex items-center gap-2 text-blue-600 text-xs">
                        <CheckCircle2 size={14} />
                        <span>Đã giải quyết</span>
                    </div>
                );
            default:
                return null;
        }
    };

    if (showGuestForm && !userId) {
        return (
            <div className="flex flex-col h-full p-6 items-center justify-center bg-gray-50">
                <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-center">Thông tin hỗ trợ</h3>
                    <p className="text-sm text-gray-500 mb-4 text-center">
                        Vui lòng nhập thông tin để chúng tôi hỗ trợ bạn tốt hơn.
                    </p>
                    <form onSubmit={handleGuestSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                value={guestInfo.name}
                                onChange={e => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                value={guestInfo.email}
                                onChange={e => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Bắt đầu chat
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Status Bar */}
            {messages.length > 0 && (
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                    {getStatusBadge()}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.sender_type === 'customer'
                                ? 'bg-black text-white rounded-tr-sm'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                                }`}
                        >
                            {msg.sender_type === 'admin' && (
                                <div className="flex items-center gap-1 mb-1 text-[10px] text-gray-500 font-bold uppercase">
                                    <User size={10} />
                                    <span>{msg.sender_first_name || 'TOAN STORE SUPPORT'} {msg.sender_last_name || ''} • {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )}
                            {msg.image_url && (
                                <div className="mb-2">
                                    {(msg.image_url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i)) ? (
                                        <img
                                            src={msg.image_url}
                                            alt="Attachment"
                                            className="max-w-full rounded-lg max-h-48 object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(msg.image_url, '_blank')}
                                        />
                                    ) : (
                                        <a
                                            href={msg.image_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-gray-100/10 rounded-lg hover:bg-gray-100/20 transition-colors border border-white/10"
                                        >
                                            <Paperclip size={16} />
                                            <span className="underline text-xs truncate max-w-[150px]">Xem tệp đính kèm</span>
                                        </a>
                                    )}
                                </div>
                            )}
                            <div>{msg.message}</div>
                            {msg.sender_type === 'customer' && (
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <div className="text-[10px] text-white/70">
                                        {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {msg.is_read ? (
                                        <div className="flex -space-x-1">
                                            <CheckCircle2 size={10} className="text-blue-400 fill-blue-400/20" />
                                            <CheckCircle2 size={10} className="text-blue-400 fill-blue-400/20" />
                                        </div>
                                    ) : (
                                        <CheckCircle2 size={10} className="text-white/40" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isAgentTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            <span className="text-[10px] text-gray-400 ml-1 font-medium">Đội ngũ TOAN Store đang soạn tin...</span>
                        </div>
                    </div>
                )}
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        Bắt đầu cuộc trò chuyện với đội ngũ hỗ trợ của chúng tôi
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            < form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100" >
                {selectedFile && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg text-xs w-fit">
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
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileSelect}
                        disabled={isLoading || chatStatus === 'closed' || chatStatus === 'resolved'}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={isLoading || chatStatus === 'closed' || chatStatus === 'resolved'}
                        title="Gửi ảnh"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={chatStatus === 'closed' ? 'Chat đã đóng' : 'Nhập tin nhắn...'}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                        disabled={isLoading || chatStatus === 'closed' || chatStatus === 'resolved'}
                    />
                    <button
                        type="submit"
                        disabled={(!inputValue.trim() && !selectedFile) || isLoading || chatStatus === 'closed' || chatStatus === 'resolved'}
                        className="p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}
