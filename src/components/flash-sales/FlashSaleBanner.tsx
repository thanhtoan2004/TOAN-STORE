"use client";
import { useEffect, useState } from "react";
import { Clock, Flame } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface FlashSaleProduct {
    id: number;
    name: string;
    imageUrl: string;
    originalPrice: number;
    flashPrice: number;
    discountPercentage: number;
    quantityLimit: number;
    quantitySold: number;
    slug: string;
}

interface FlashSale {
    id: number;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    products: FlashSaleProduct[];
}

export default function FlashSaleBanner() {
    const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
    const [timeLeft, setTimeLeft] = useState<{
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        fetchActiveFlashSale();
    }, []);

    useEffect(() => {
        if (!flashSale) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(flashSale.endTime).getTime();
            const distance = end - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft(null);
                return;
            }

            setTimeLeft({
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [flashSale]);

    const fetchActiveFlashSale = async () => {
        try {
            const response = await fetch('/api/flash-sales/active');
            const result = await response.json();
            if (result.success && result.data) {
                setFlashSale(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch flash sale:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (!flashSale || !timeLeft) return null;

    return (
        <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Flame className="w-8 h-8 animate-pulse" />
                        <div>
                            <h2 className="text-3xl font-bold">{flashSale.name}</h2>
                            <p className="text-white/90">{flashSale.description}</p>
                        </div>
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center gap-4">
                        <Clock className="w-6 h-6" />
                        <div className="flex gap-2">
                            <TimeUnit value={timeLeft.hours} label="Giờ" />
                            <span className="text-2xl font-bold">:</span>
                            <TimeUnit value={timeLeft.minutes} label="Phút" />
                            <span className="text-2xl font-bold">:</span>
                            <TimeUnit value={timeLeft.seconds} label="Giây" />
                        </div>
                    </div>
                </div>

                {/* Products */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {flashSale.products.slice(0, 6).map((product) => {
                        const soldPercentage = (product.quantitySold / product.quantityLimit) * 100;

                        return (
                            <Link
                                key={product.id}
                                href={`/products/${product.id}`}
                                className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                <div className="relative aspect-square">
                                    <Image
                                        src={product.imageUrl || '/images/placeholder.png'}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                                        -{product.discountPercentage}%
                                    </div>
                                </div>
                                <div className="p-3 text-gray-900">
                                    <h3 className="font-semibold text-sm truncate mb-2">{product.name}</h3>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-lg font-bold text-red-600">
                                            {formatCurrency(product.flashPrice)}
                                        </span>
                                        <span className="text-xs text-gray-500 line-through">
                                            {formatCurrency(product.originalPrice)}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-1">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-red-600 h-2 rounded-full transition-all"
                                                style={{ width: `${soldPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Đã bán {product.quantitySold}/{product.quantityLimit}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {flashSale.products.length > 6 && (
                    <div className="text-center mt-6">
                        <Link
                            href="/flash-sales"
                            className="inline-block bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Xem tất cả sản phẩm Flash Sale
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold">{value.toString().padStart(2, '0')}</div>
            </div>
            <div className="text-xs mt-1 opacity-90">{label}</div>
        </div>
    );
}
