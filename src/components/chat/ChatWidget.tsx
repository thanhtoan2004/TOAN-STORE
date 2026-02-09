"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles, Headphones } from 'lucide-react';
import LiveSupportChat from './LiveSupportChat';

interface Message {
    id: string;
    role: 'user' | 'model';
    content: string;
}

import { useAuth } from '@/contexts/AuthContext';

type ChatMode = 'ai' | 'live';

import { usePathname } from 'next/navigation';

export default function ChatWidget() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Don't show chat widget on admin pages
    if (pathname?.startsWith('/admin')) return null;

    const [chatMode, setChatMode] = useState<ChatMode>('ai');
    const { user } = useAuth();
    const userId = user?.id ? parseInt(user.id.toString()) : undefined;
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'model',
            content: 'Chào bạn! Tôi là trợ lý ảo AI của cửa hàng. Tôi có thể giúp gì cho bạn hôm nay?'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Filter out the welcome message for API history
            const history = messages
                .filter(m => m.id !== 'welcome')
                .map(m => ({
                    role: m.role,
                    content: m.content
                }));

            const response = await fetch('/api/chat/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: history
                })
            });

            const data = await response.json();

            if (data.text) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    content: data.text
                }]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-black text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {chatMode === 'ai' ? (
                                    <Sparkles size={18} className="text-yellow-400" />
                                ) : (
                                    <Headphones size={18} className="text-green-400" />
                                )}
                                <h3 className="font-bold">Nike Support</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 bg-white">
                            <button
                                onClick={() => setChatMode('ai')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${chatMode === 'ai'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Sparkles size={16} />
                                    <span>AI Assistant</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setChatMode('live')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${chatMode === 'live'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Headphones size={16} />
                                    <span>Live Support</span>
                                </div>
                            </button>
                        </div>

                        {/* Content */}
                        {chatMode === 'ai' ? (
                            <>
                                {/* AI Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user'
                                                    ? 'bg-black text-white rounded-tr-sm'
                                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                                                <Loader2 size={16} className="animate-spin text-gray-500" />
                                                <span className="text-xs text-gray-400">Đang trả lời...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* AI Input */}
                                <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Hỏi gì đó..."
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputValue.trim() || isLoading}
                                            className="p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <LiveSupportChat userId={userId} guestEmail={undefined} guestName={undefined} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-gray-900 transition-colors"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <X size={24} />
                    ) : (
                        <MessageSquare size={24} />
                    )}
                </AnimatePresence>
            </motion.button>
        </>
    );
}
