'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
    const { language, setLanguage } = useLanguage();

    const activeClass = theme === 'dark' ? 'text-white font-bold' : 'text-black font-bold';
    const inactiveClass = theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black';
    const dividerClass = theme === 'dark' ? 'text-gray-500' : 'text-gray-300';

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => setLanguage('vi')}
                className={`text-sm font-medium transition-colors ${language === 'vi' ? activeClass : inactiveClass}`}
            >
                VN
            </button>
            <span className={dividerClass}>|</span>
            <button
                onClick={() => setLanguage('en')}
                className={`text-sm font-medium transition-colors ${language === 'en' ? activeClass : inactiveClass}`}
            >
                EN
            </button>
        </div>
    );
}
