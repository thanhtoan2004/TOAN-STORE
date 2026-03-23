'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

/**
 * Mobile App Download / Install Banner.
 * Hiển thị banner gợi ý cài đặt PWA khi truy cập từ mobile và chưa cài.
 * Sử dụng beforeinstallprompt event để trigger Install Prompt.
 */
export default function AppInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Ẩn nếu đã dismiss trong 30 ngày
    const dismissed = localStorage.getItem('app_install_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 30 * 24 * 60 * 60 * 1000) return;

    // Ẩn nếu đã cài (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('app_install_dismissed', Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] md:hidden animate-in slide-in-from-top duration-300">
      <div className="bg-black text-white px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <img src="/icons/icon-512x512.png" alt="Logo" className="h-6 w-6 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">TOAN Store</p>
          <p className="text-xs text-gray-300">Cài ứng dụng để mua sắm nhanh hơn!</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-full flex items-center gap-1 flex-shrink-0"
        >
          <Download className="w-3 h-3" />
          Cài đặt
        </button>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
