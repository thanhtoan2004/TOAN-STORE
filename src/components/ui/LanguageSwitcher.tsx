'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => setLanguage('vi')}
                className={`text-sm font-medium transition-colors ${language === 'vi' ? 'text-black font-bold' : 'text-gray-500 hover:text-black'
                    }`}
            >
                VN
            </button>
            <span className="text-gray-300">|</span>
            <button
                onClick={() => setLanguage('en')}
                className={`text-sm font-medium transition-colors ${language === 'en' ? 'text-black font-bold' : 'text-gray-500 hover:text-black'
                    }`}
            >
                EN
            </button>
        </div>
    );
}
