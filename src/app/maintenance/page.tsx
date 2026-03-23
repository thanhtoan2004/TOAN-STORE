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
      setCountdown((prev) => (prev === 0 ? 5 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-block bg-white p-6 rounded-2xl shadow-2xl">
            <img
              src="/icons/icon-512x512.png"
              alt="TOAN Store"
              className="w-24 h-24 object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Đang Bảo Trì</h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8">We're Making Things Better</p>

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
            href="mailto:admin@toanstore.com"
            className="text-white hover:text-gray-300 transition-colors underline"
          >
            admin@toanstore.com
          </a>
        </div>
      </div>
    </div>
  );
}
