'use client';

import { useEffect, useState } from 'react';

export default function MaintenancePage() {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Check every 5 seconds if maintenance mode is off
        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/maintenance-check');
                const data = await response.json();

                if (!data.maintenance) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Error checking maintenance status:', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => prev === 0 ? 5 : prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
            <div className="max-w-2xl w-full text-center">
                {/* Logo */}
                <div className="mb-8">
                    <div className="inline-block bg-white p-8 rounded-2xl shadow-2xl">
                        <svg className="w-24 h-24 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 7.8L6.442 15.276c-1.456.616-2.679.925-3.668.925-1.12 0-1.933-.392-2.437-1.177-.317-.504-.41-1.143-.28-1.918.13-.775.476-1.6 1.036-2.478.56-.877 1.386-1.766 2.478-2.665 1.092-.9 2.4-1.726 3.925-2.478C9.02 4.712 10.7 4.087 12.533 3.65c1.833-.436 3.645-.654 5.436-.654 1.791 0 3.344.199 4.657.597l1.374.336zm-4.243 4.995c-.186 1.03-.65 1.857-1.393 2.478-.743.622-1.618.933-2.625.933-.93 0-1.766-.261-2.507-.784-.742-.522-1.206-1.19-1.393-2.002-.13-.597-.056-1.163.224-1.698.28-.535.7-.98 1.26-1.336.56-.355 1.21-.533 1.95-.533.93 0 1.747.243 2.45.728.701.486 1.15 1.12 1.345 1.903.074.28.093.56.056.84-.037.28-.13.533-.28.784-.15.251-.355.448-.616.59-.261.143-.542.214-.844.214-.392 0-.765-.13-1.12-.392-.355-.261-.597-.597-.728-1.008-.074-.224-.056-.448.056-.672.112-.224.28-.392.504-.504.224-.112.448-.13.672-.056.224.075.392.224.504.448.075.15.094.317.056.504-.037.186-.15.336-.336.448-.112.075-.224.094-.336.056-.112-.038-.224-.15-.336-.336l-.168-.336c-.075-.15-.168-.243-.28-.28-.112-.037-.224-.019-.336.056-.112.074-.168.205-.168.392 0 .224.093.448.28.672.186.224.467.336.84.336.467 0 .877-.168 1.232-.504.355-.336.56-.747.616-1.232.037-.374-.037-.728-.224-1.064-.186-.336-.504-.597-.952-.784-.448-.186-.952-.28-1.512-.28-.896 0-1.68.205-2.352.616-.672.41-1.12.933-1.344 1.568-.149.448-.149.896 0 1.344.15.448.448.84.896 1.176.448.336 1.008.504 1.68.504.896 0 1.68-.28 2.352-.84.672-.56 1.064-1.26 1.176-2.1z" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                    Đang Bảo Trì
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-gray-300 mb-8">
                    We're Making Things Better
                </p>

                {/* Description */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
                    <p className="text-gray-200 text-lg mb-4">
                        Website đang được nâng cấp để mang đến trải nghiệm tốt hơn cho bạn.
                    </p>
                    <p className="text-gray-300">
                        Chúng tôi sẽ quay lại sớm nhất có thể. Cảm ơn bạn đã kiên nhẫn chờ đợi!
                    </p>
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Kiểm tra lại sau {countdown}s...</span>
                </div>

                {/* Contact Info */}
                <div className="mt-12 text-gray-400">
                    <p className="mb-2">Cần hỗ trợ gấp?</p>
                    <a
                        href="mailto:admin@nike-clone.com"
                        className="text-white hover:text-gray-300 transition-colors underline"
                    >
                        admin@nike-clone.com
                    </a>
                </div>
            </div>
        </div>
    );
}
