'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowRight, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { dictionary } from '@/lib/dictionary';

export default function NotFound() {
    const langContext = useLanguage();

    // Fallback to Vietnamese if context is somehow unavailable during 404 render
    const t = langContext?.t || dictionary['vi'];

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-white">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Animated Icon/Visual */}
                <div className="relative inline-block">
                    <div className="text-[120px] font-black text-gray-100 select-none leading-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pt-8">
                        <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white transform -rotate-12 shadow-2xl animate-bounce">
                            <Search size={40} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl uppercase italic">
                        {(t as any).not_found?.title || 'Không tìm thấy trang'}
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        {(t as any).not_found?.desc || 'Có vẻ như đôi giày này đã được bán sạch hoặc đường dẫn này không còn tồn tại nữa.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link
                        href="/"
                        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-black rounded-full overflow-hidden transition-all hover:pr-12 active:scale-95"
                    >
                        <span className="relative">{(t as any).not_found?.back_home || 'Về Trang Chủ'}</span>
                        <ArrowRight className="absolute right-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" size={20} />
                    </Link>

                    <Link
                        href="/categories"
                        className="inline-flex items-center justify-center px-8 py-4 font-bold text-black border-2 border-gray-200 rounded-full hover:border-black transition-all active:scale-95 gap-2"
                    >
                        <ShoppingBag size={20} />
                        {(t as any).not_found?.shop_now || 'Tiếp Tục Mua Sắm'}
                    </Link>
                </div>

                <div className="pt-12">
                    <p className="text-sm text-gray-400 font-medium uppercase tracking-[0.2em]">
                        TOAN Store / TOAN Store Inc.
                    </p>
                </div>
            </div>
        </div>
    );
}
