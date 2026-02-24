'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'nike_cookie_consent';

interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const { language } = useLanguage();

    const [preferences, setPreferences] = useState<CookiePreferences>({
        necessary: true,
        analytics: true,
        marketing: false,
    });

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Delay showing to avoid layout shift
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptAll = () => {
        const prefs: CookiePreferences = { necessary: true, analytics: true, marketing: true };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...prefs, timestamp: Date.now() }));
        setVisible(false);
    };

    const acceptSelected = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...preferences, timestamp: Date.now() }));
        setVisible(false);
    };

    const rejectAll = () => {
        const prefs: CookiePreferences = { necessary: true, analytics: false, marketing: false };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...prefs, timestamp: Date.now() }));
        setVisible(false);
    };

    const isVi = language === 'vi';

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
                >
                    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="p-5 md:p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                                    <Cookie className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        {isVi ? 'Chúng tôi sử dụng Cookie 🍪' : 'We use Cookies 🍪'}
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {isVi
                                            ? 'Chúng tôi sử dụng cookie để cải thiện trải nghiệm của bạn, phân tích lưu lượng truy cập và hiển thị quảng cáo phù hợp. '
                                            : 'We use cookies to improve your experience, analyze traffic, and show relevant ads. '}
                                        <Link href="/privacy-policy" className="underline underline-offset-2 font-medium hover:text-black transition-colors">
                                            {isVi ? 'Chính sách quyền riêng tư' : 'Privacy Policy'}
                                        </Link>
                                    </p>
                                </div>
                                <button
                                    onClick={rejectAll}
                                    className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* Cookie Details (Toggle) */}
                            <AnimatePresence>
                                {showDetails && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 space-y-3 border-t pt-4">
                                            {/* Necessary */}
                                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div>
                                                    <span className="font-semibold text-sm text-gray-900">
                                                        {isVi ? 'Cần thiết' : 'Necessary'}
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {isVi ? 'Cần cho hoạt động cơ bản của website' : 'Required for basic site functionality'}
                                                    </p>
                                                </div>
                                                <input type="checkbox" checked disabled className="w-4 h-4 accent-black" />
                                            </label>

                                            {/* Analytics */}
                                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                <div>
                                                    <span className="font-semibold text-sm text-gray-900">
                                                        {isVi ? 'Phân tích' : 'Analytics'}
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {isVi ? 'Giúp chúng tôi hiểu cách bạn sử dụng website' : 'Help us understand how you use the site'}
                                                    </p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.analytics}
                                                    onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                                                    className="w-4 h-4 accent-black cursor-pointer"
                                                />
                                            </label>

                                            {/* Marketing */}
                                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                <div>
                                                    <span className="font-semibold text-sm text-gray-900">
                                                        {isVi ? 'Tiếp thị' : 'Marketing'}
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {isVi ? 'Hiển thị quảng cáo phù hợp với bạn' : 'Show ads relevant to your interests'}
                                                    </p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.marketing}
                                                    onChange={(e) => setPreferences(p => ({ ...p, marketing: e.target.checked }))}
                                                    className="w-4 h-4 accent-black cursor-pointer"
                                                />
                                            </label>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-400 transition-all"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    {isVi ? 'Tùy chỉnh' : 'Customize'}
                                </button>
                                {showDetails && (
                                    <button
                                        onClick={acceptSelected}
                                        className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-400 transition-all"
                                    >
                                        {isVi ? 'Lưu tùy chọn' : 'Save Preferences'}
                                    </button>
                                )}
                                <button
                                    onClick={acceptAll}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-black rounded-full hover:bg-gray-800 transition-all active:scale-95 sm:ml-auto"
                                >
                                    {isVi ? 'Chấp nhận tất cả' : 'Accept All'}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
