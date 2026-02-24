"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles, Headphones } from 'lucide-react';
import LiveSupportChat from './LiveSupportChat';

import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { usePathname } from 'next/navigation';

type ChatMode = 'ai' | 'live';

interface Message {
    id: string;
    role: 'user' | 'model';
    content: string;
    data?: any;
    dataType?: 'products' | 'order' | 'intent_add_to_cart';
}

const ProductCard = ({ product }: { product: any }) => (
    <div className="flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
            <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover transition-transform hover:scale-105"
            />
        </div>
        <div className="p-3 flex flex-col gap-1">
            <h4 className="text-xs font-bold text-gray-900 line-clamp-2 uppercase h-8">{product.name}</h4>
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                {product.originalPrice > product.price && (
                    <span className="text-[10px] text-gray-400 line-through">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                    </span>
                )}
            </div>
            <Link
                href={product.link}
                className="mt-2 text-center py-1.5 bg-black text-white text-[10px] font-bold rounded-full uppercase hover:bg-gray-800 transition-colors"
            >
                Xem chi tiết
            </Link>
        </div>
    </div>
);

const OrderStatus = ({ order }: { order: any }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
        <div className="flex justify-between items-start border-b border-gray-200 pb-2">
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Mã đơn hàng</p>
                <p className="text-sm font-black text-black">{order.order_number}</p>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                {order.status}
            </div>
        </div>
        <div className="space-y-1">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Tóm tắt</p>
            <div className="text-xs text-gray-700">
                <p>Tổng tiền: <span className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}</span></p>
                <p>Thanh toán: <span className="capitalize font-medium">{order.payment_status}</span></p>
                <p>Ngày đặt: {new Date(order.placed_at).toLocaleDateString('vi-VN')}</p>
            </div>
        </div>
    </div>
);

const IntentCard = ({ product, intent, onConfirm }: { product: any, intent: any, onConfirm: (productId: number, quantity: number, size: string) => void }) => {
    const [selectedSize, setSelectedSize] = useState<string>(intent.size || '');
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    const availableSizes = product.sizes ? product.sizes.split(',').map((s: string) => s.trim()) : [];

    const handleConfirm = async () => {
        if (!selectedSize) return;
        setIsAdding(true);
        await onConfirm(parseInt(product.id), intent.quantity || 1, selectedSize);
        setIsAdding(false);
        setIsAdded(true);
    };

    if (isAdded) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Send size={16} className="rotate-[-45deg]" />
                </div>
                <p className="text-xs font-bold text-green-800">Đã thêm vào giỏ hàng!</p>
                <Link href="/cart" className="text-[10px] underline text-green-600 hover:text-green-800">
                    Xem giỏ hàng ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex gap-3 p-3 bg-gray-50/50 border-b border-gray-100">
                <div className="w-12 h-12 bg-white rounded-md border border-gray-200 overflow-hidden flex-shrink-0">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{product.name}</h4>
                    <p className="text-[10px] text-gray-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>
                </div>
            </div>
            <div className="p-3 space-y-3">
                {!intent.size && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Chọn Size</label>
                        <div className="flex flex-wrap gap-1.5">
                            {availableSizes.map((size: string) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`px-2.5 py-1 text-[10px] font-bold border rounded-md transition-all ${selectedSize === size
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <button
                    onClick={handleConfirm}
                    disabled={!selectedSize || isAdding}
                    className="w-full py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {isAdding ? <Loader2 size={12} className="animate-spin" /> : 'Thêm vào giỏ hàng'}
                    {!isAdding && intent.quantity > 1 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">x{intent.quantity}</span>}
                </button>
            </div>
        </div>
    );
};

export default function ChatWidget() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode>('ai');
    const { user } = useAuth();
    const { addToCart } = useCart();
    const userId = user?.id ? parseInt(user.id.toString()) : undefined;
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'model',
            content: 'Chào bạn! Tôi là trợ lý ảo AI cao cấp của Nike. Tôi có thể giúp bạn tìm sản phẩm, xem hàng mới về hoặc tra cứu trạng thái đơn hàng. Bạn cần giúp gì hôm nay?'
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

    if (pathname?.startsWith('/admin')) return null;

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
                    content: data.text,
                    data: data.data,
                    dataType: data.dataType
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
                        className="fixed bottom-24 right-6 w-[340px] h-[480px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-black text-white p-3.5 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center">
                                    {chatMode === 'ai' ? (
                                        <Sparkles size={16} className="text-yellow-400" />
                                    ) : (
                                        <Headphones size={16} className="text-green-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-xs tracking-tight">NIKE ASSISTANT</h3>
                                    <p className="text-[9px] text-gray-400 font-medium">Trực tuyến 24/7</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 bg-white px-2">
                            <button
                                onClick={() => setChatMode('ai')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${chatMode === 'ai'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Sparkles size={12} />
                                    <span>AI Support</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setChatMode('live')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${chatMode === 'live'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Headphones size={12} />
                                    <span>Live Agent</span>
                                </div>
                            </button>
                        </div>

                        {/* Content */}
                        {chatMode === 'ai' ? (
                            <>
                                {/* AI Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 scrollbar-hide">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed shadow-sm ${msg.role === 'user'
                                                    ? 'bg-black text-white rounded-tr-none'
                                                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>

                                            {/* Data Rendering (Products/Order) */}
                                            {msg.data && msg.dataType === 'products' && Array.isArray(msg.data) && msg.data.length > 0 && (
                                                <div className="mt-3 w-full grid grid-cols-2 gap-2">
                                                    {msg.data.map((product: any, idx: number) => (
                                                        <ProductCard key={idx} product={product} />
                                                    ))}
                                                </div>
                                            )}

                                            {msg.data && msg.dataType === 'order' && (
                                                <div className="mt-3 w-[85%]">
                                                    <OrderStatus order={msg.data} />
                                                </div>
                                            )}

                                            {msg.data && msg.dataType === 'intent_add_to_cart' && (
                                                <div className="mt-3 w-[85%]">
                                                    <IntentCard
                                                        product={msg.data.product}
                                                        intent={msg.data.intent}
                                                        onConfirm={async (pid, qty, sz) => {
                                                            // Simply call the hook function
                                                            await addToCart(pid, qty, sz);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                                                <div className="flex gap-1">
                                                    <motion.span
                                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                                                        className="w-1.5 h-1.5 bg-black rounded-full"
                                                    />
                                                    <motion.span
                                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                                        className="w-1.5 h-1.5 bg-black rounded-full"
                                                    />
                                                    <motion.span
                                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                                        className="w-1.5 h-1.5 bg-black rounded-full"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assistant is typing</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* AI Input */}
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <form onSubmit={handleSubmit} className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Bạn cần tìm gì hôm nay?"
                                            className="w-full pl-5 pr-12 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-black/5 text-sm font-medium placeholder:text-gray-400 transition-all"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputValue.trim() || isLoading}
                                            className="absolute right-2 p-1.5 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-20 disabled:grayscale transition-all"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                    <p className="text-center text-[8px] text-gray-400 mt-1.5 font-medium uppercase tracking-tighter">Powered TOAN Store AI</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 overflow-hidden">
                                <LiveSupportChat userId={userId} guestEmail={undefined} guestName={undefined} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-gray-900 transition-all group"
            >
                <div className="absolute inset-0 bg-black rounded-full animate-ping opacity-20 group-hover:hidden" />
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X size={28} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <MessageSquare size={28} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </>
    );
}
