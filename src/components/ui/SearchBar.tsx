"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Mic } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SearchResult {
    id: number;
    name: string;
    slug: string;
    category: string;
    base_price: number;
    retail_price?: number;
    image_url: string;
}

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const router = useRouter();

    // Voice Search Setup
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.lang = 'vi-VN';
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
    }, []);

    const toggleVoiceSearch = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setQuery("");
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    // Debounce search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
                const data = await response.json();
                if (data.success) {
                    setResults(data.data.products);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length >= 2) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const formatPrice = (price: number | undefined | null) => {
        if (!price || typeof price !== 'number') return '0 ₫';
        return price.toLocaleString('vi-VN') + ' ₫';
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
                        placeholder={isListening ? "Đang nghe..." : "Tìm kiếm sản phẩm..."}
                        className={`w-full pl-10 pr-20 py-2 border ${isListening ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-full focus:outline-none focus:border-black transition-all`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {isLoading && (
                            <div className="p-1">
                                <Loader2 className="animate-spin text-gray-400" size={18} />
                            </div>
                        ) || query && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                        {speechSupported && (
                            <button
                                type="button"
                                onClick={toggleVoiceSearch}
                                className={`p-2 rounded-full transition-all ${isListening
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'text-gray-400 hover:text-black hover:bg-gray-100'
                                    }`}
                                title={isListening ? 'Dừng nghe' : 'Tìm kiếm bằng giọng nói'}
                            >
                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" x2="12" y1="19" y2="22" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* Search Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                        {results.map((product) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.slug || product.id}`}
                                onClick={() => {
                                    setIsOpen(false);
                                    setQuery("");
                                }}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded">
                                    <Image
                                        src={product.image_url}
                                        alt={product.name}
                                        fill
                                        className="object-cover rounded"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                                    <p className="text-xs text-gray-500">{product.category}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {product.retail_price && product.base_price && product.retail_price < product.base_price ? (
                                            <>
                                                <span className="text-sm font-semibold text-red-600">
                                                    {formatPrice(product.retail_price)}
                                                </span>
                                                <span className="text-xs text-gray-400 line-through">
                                                    {formatPrice(product.base_price)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm font-semibold">
                                                {formatPrice(product.retail_price || product.base_price)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {results.length >= 5 && (
                        <div className="border-t p-3">
                            <Link
                                href={`/search?q=${encodeURIComponent(query)}`}
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-center block text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Xem tất cả kết quả cho "{query}"
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* No Results */}
            {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
                    <p className="text-gray-500">Không tìm thấy sản phẩm nào cho "{query}"</p>
                </div>
            )}
        </div>
    );
}
