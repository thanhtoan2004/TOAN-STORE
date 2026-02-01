'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionary, Locale } from '@/lib/dictionary';

interface LanguageContextType {
    language: Locale;
    setLanguage: (lang: Locale) => void;
    t: typeof dictionary['vi'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

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
