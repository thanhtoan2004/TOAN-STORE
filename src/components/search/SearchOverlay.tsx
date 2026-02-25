
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, ArrowRight, Mic } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
    id: number;
    name: string;
    slug: string;
    category_name: string;
    current_price: number;
    image_url: string;
    _highlightResult?: any;
}

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const router = useRouter();

    // Voice Search — Web Speech API setup
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.lang = 'vi-VN'; // Hỗ trợ tiếng Việt
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');
                setQuery(transcript);
            };

            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);

            recognitionRef.current = recognition;
        }
        return () => {
            recognitionRef.current?.abort();
        };
    }, []);

    const toggleVoiceSearch = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setQuery('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            document.body.style.overflow = 'auto';
            setQuery('');
            setResults([]);
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=8`);
                const data = await res.json();
                if (data.success) {
                    setResults(data.data.products);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            onClose();
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-white"
                >
                    <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" onClick={onClose} className="hover:opacity-70 transition-opacity">
                                <svg className="h-10 w-20 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="currentColor" fillRule="evenodd" d="M21 8.719L7.836 14.303C6.74 14.768 5.818 15 5.075 15c-.836 0-1.445-.295-1.819-.884-.485-.76-.273-1.982.559-3.272.494-.754 1.122-1.446 1.734-2.108-.144.234-1.415 2.349-.025 3.345.275.2.666.298 1.147.298.386 0 .829-.063 1.316-.19L21 8.719z" clipRule="evenodd" />
                                </svg>
                            </Link>

                            <div className="flex-1 max-w-2xl mx-auto px-4">
                                <form onSubmit={handleSearch} className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                    </div>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="w-full bg-gray-100 border-none rounded-full py-3.5 pl-12 pr-12 text-lg focus:ring-0 placeholder:text-gray-400 outline-none hover:bg-gray-200 transition-colors"
                                        placeholder="Tìm kiếm..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                    {isLoading && (
                                        <div className="absolute inset-y-0 right-14 flex items-center">
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                    {query && (
                                        <button
                                            type="button"
                                            onClick={() => setQuery('')}
                                            className="absolute inset-y-0 right-14 flex items-center p-2 hover:bg-gray-200 rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    )}
                                    {speechSupported && (
                                        <button
                                            type="button"
                                            onClick={toggleVoiceSearch}
                                            className={`absolute inset-y-0 right-4 flex items-center p-2 rounded-full transition-all ${isListening
                                                ? 'bg-red-100 text-red-600 animate-pulse'
                                                : 'hover:bg-gray-200 text-gray-400 hover:text-black'
                                                }`}
                                            title={isListening ? 'Đang nghe... Nhấn để dừng' : 'Tìm kiếm bằng giọng nói'}
                                        >
                                            <Mic className={`w-5 h-5 ${isListening ? 'text-red-600' : ''}`} />
                                        </button>
                                    )}
                                </form>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
                            >
                                <span className="text-sm font-medium pr-2">Đóng</span>
                                <X className="w-6 h-6 inline-block" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
                            {/* Suggestions */}
                            <div className="lg:col-span-3">
                                <h3 className="text-gray-400 text-sm font-medium mb-4 uppercase tracking-wider">Tìm kiếm phổ biến</h3>
                                <ul className="space-y-4">
                                    {['Air Force 1', 'Jordan', 'Air Max', 'Dunk', 'Running'].map((term) => (
                                        <li key={term}>
                                            <button
                                                onClick={() => setQuery(term)}
                                                className="text-xl font-medium hover:text-gray-500 transition-colors text-black"
                                            >
                                                {term}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Results */}
                            <div className="lg:col-span-9">
                                {query.length > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                                                {results.length > 0 ? `Kết quả cho "${query}"` : `Không tìm thấy kết quả cho "${query}"`}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {results.map((product) => (
                                                <Link
                                                    key={product.id}
                                                    href={`/products/${product.slug || product.id}`}
                                                    onClick={onClose}
                                                    className="group"
                                                >
                                                    <div className="relative aspect-square bg-gray-100 rounded-sm overflow-hidden mb-3">
                                                        <Image
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                    <h4 className="font-medium text-sm text-black line-clamp-1 group-hover:underline decoration-1 underline-offset-4">
                                                        {product.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">{product.category_name}</p>
                                                    <p className="font-medium text-sm mt-1 text-black">
                                                        {formatPrice(product.current_price)}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>

                                        {results.length > 0 && (
                                            <Link
                                                href={`/search?q=${encodeURIComponent(query)}`}
                                                onClick={onClose}
                                                className="inline-flex items-center gap-2 mt-8 py-3 px-6 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium text-sm"
                                            >
                                                Xem tất cả kết quả cho "{query}"
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Search className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-medium mb-2 text-black">Nhập từ khóa tìm kiếm</h3>
                                        <p className="text-gray-500 mb-4">Bắt đầu nhập để xem kết quả ngay lập tức.</p>
                                        {speechSupported && (
                                            <button
                                                onClick={toggleVoiceSearch}
                                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${isListening
                                                    ? 'bg-red-100 text-red-700 animate-pulse'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                <Mic className="w-4 h-4" />
                                                {isListening ? 'Đang nghe... 🎙️' : 'Hoặc tìm kiếm bằng giọng nói'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
