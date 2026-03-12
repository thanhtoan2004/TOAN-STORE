'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionary, Locale } from '@/lib/utils/dictionary';

/**
 * LanguageContextType: Kiểu dữ liệu chứa state ngôn ngữ hiện tại và từ điển dịch.
 */
interface LanguageContextType {
  language: Locale; // Mã ngôn ngữ hiện tại ('vi' hoặc 'en')
  setLanguage: (lang: Locale) => void; // Hàm đổi ngôn ngữ
  t: (typeof dictionary)['vi']; // Object `t` chứa bộ từ vựng đã được map tự động theo ngôn ngữ đang chọn
}

// Khởi tạo Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * LanguageProvider: Bao bọc ứng dụng để cung cấp hệ thống Đa Ngôn Ngữ (i18n).
 * Đọc cài đặt ngôn ngữ từ localStorage khi load trang và tự động gióng 't' vào đúng bộ từ điển `vi` hoặc `en`.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Locale>('vi');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('language') as Locale;
    if (saved && (saved === 'vi' || saved === 'en')) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = dictionary[language];

  // Prevent hydration mismatch by identifying mounted state,
  // but we still render children to avoid layout shift, just using default 'vi' initially server-side

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
