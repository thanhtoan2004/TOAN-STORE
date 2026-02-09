"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
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
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

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
                        placeholder="Tìm kiếm sản phẩm..."
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-black transition-colors"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    )}
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-gray-400" size={20} />
                        </div>
                    )}
                </div>
            </form>

            {/* Search Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                        {results.map((product) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.id}`}
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
