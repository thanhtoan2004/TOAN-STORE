'use client';

import { useState, useEffect, useCallback } from 'react';
import { Type, Eye, Minus, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const FONT_SIZE_KEY = 'nike_font_size';
const REDUCE_MOTION_KEY = 'nike_reduce_motion';
const HIGH_CONTRAST_KEY = 'highContrast';
const COLOR_BLIND_KEY = 'colorBlindFriendly';

const FONT_SIZES = [
    { label: 'S', value: 14, scale: 0.875 },
    { label: 'M', value: 16, scale: 1 },
    { label: 'L', value: 18, scale: 1.125 },
    { label: 'XL', value: 20, scale: 1.25 },
];

export default function AccessibilityWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [fontSizeIndex, setFontSizeIndex] = useState(1); // default M
    const [reduceMotion, setReduceMotion] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [colorBlindFriendly, setColorBlindFriendly] = useState(false);
    const { language } = useLanguage();
    const isVi = language === 'vi';

    // Load preferences
    useEffect(() => {
        const savedSize = localStorage.getItem(FONT_SIZE_KEY);
        const savedMotion = localStorage.getItem(REDUCE_MOTION_KEY);
        const savedContrast = localStorage.getItem(HIGH_CONTRAST_KEY);
        const savedColorBlind = localStorage.getItem(COLOR_BLIND_KEY);

        if (savedSize) {
            const idx = parseInt(savedSize);
            if (idx >= 0 && idx < FONT_SIZES.length) {
                setFontSizeIndex(idx);
                document.documentElement.style.fontSize = `${FONT_SIZES[idx].value}px`;
            }
        }

        if (savedMotion === 'true') {
            setReduceMotion(true);
            document.documentElement.classList.add('reduce-motion');
        }

        if (savedContrast === 'true') {
            setHighContrast(true);
            document.documentElement.classList.add('high-contrast');
        }

        if (savedColorBlind === 'true') {
            setColorBlindFriendly(true);
            document.documentElement.classList.add('color-blind-friendly');
        }
    }, []);

    const handleFontSizeChange = useCallback((index: number) => {
        setFontSizeIndex(index);
        localStorage.setItem(FONT_SIZE_KEY, index.toString());
        document.documentElement.style.fontSize = `${FONT_SIZES[index].value}px`;
    }, []);

    const decreaseFontSize = useCallback(() => {
        if (fontSizeIndex > 0) handleFontSizeChange(fontSizeIndex - 1);
    }, [fontSizeIndex, handleFontSizeChange]);

    const increaseFontSize = useCallback(() => {
        if (fontSizeIndex < FONT_SIZES.length - 1) handleFontSizeChange(fontSizeIndex + 1);
    }, [fontSizeIndex, handleFontSizeChange]);

    const toggleReduceMotion = useCallback(() => {
        setReduceMotion(prev => {
            const next = !prev;
            localStorage.setItem(REDUCE_MOTION_KEY, next.toString());
            document.documentElement.classList.toggle('reduce-motion', next);
            return next;
        });
    }, []);

    const toggleHighContrast = useCallback(() => {
        setHighContrast(prev => {
            const next = !prev;
            localStorage.setItem(HIGH_CONTRAST_KEY, next.toString());
            document.documentElement.classList.toggle('high-contrast', next);
            return next;
        });
    }, []);

    const toggleColorBlind = useCallback(() => {
        setColorBlindFriendly(prev => {
            const next = !prev;
            localStorage.setItem(COLOR_BLIND_KEY, next.toString());
            document.documentElement.classList.toggle('color-blind-friendly', next);
            return next;
        });
    }, []);

    return (
        <>
            {/* Toggle Button - Fixed on left side */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed left-4 bottom-36 md:bottom-24 z-[9998] w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
                aria-label={isVi ? 'Cài đặt trợ năng' : 'Accessibility settings'}
                title={isVi ? 'Trợ năng' : 'Accessibility'}
            >
                <Eye className="w-4 h-4 text-gray-700" />
            </button>

            {/* Settings Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed left-4 bottom-52 md:bottom-40 z-[9998] w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900">
                                {isVi ? 'Trợ năng' : 'Accessibility'}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-4 space-y-5">
                            {/* Font Size */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    <Type className="w-3.5 h-3.5" />
                                    {isVi ? 'Cỡ chữ' : 'Font Size'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={decreaseFontSize}
                                        disabled={fontSizeIndex === 0}
                                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg disabled:opacity-30 hover:border-gray-400 transition-all"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <div className="flex-1 flex gap-1">
                                        {FONT_SIZES.map((size, i) => (
                                            <button
                                                key={size.label}
                                                onClick={() => handleFontSizeChange(i)}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${i === fontSizeIndex
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {size.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={increaseFontSize}
                                        disabled={fontSizeIndex === FONT_SIZES.length - 1}
                                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg disabled:opacity-30 hover:border-gray-400 transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Reduce Motion */}
                            <div className="space-y-3">
                                <button
                                    onClick={toggleReduceMotion}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <span className="text-sm font-medium text-gray-700">
                                        {isVi ? 'Giảm chuyển động' : 'Reduce Motion'}
                                    </span>
                                    <div className={`relative w-10 h-5 rounded-full transition-colors ${reduceMotion ? 'bg-black' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${reduceMotion ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>

                                <button
                                    onClick={toggleHighContrast}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <span className="text-sm font-medium text-gray-700">
                                        {isVi ? 'Tương phản cao' : 'High Contrast'}
                                    </span>
                                    <div className={`relative w-10 h-5 rounded-full transition-colors ${highContrast ? 'bg-black' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${highContrast ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>

                                <button
                                    onClick={toggleColorBlind}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <span className="text-sm font-medium text-gray-700">
                                        {isVi ? 'Chế độ mù màu' : 'Color Blind Mode'}
                                    </span>
                                    <div className={`relative w-10 h-5 rounded-full transition-colors ${colorBlindFriendly ? 'bg-black' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${colorBlindFriendly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>
                            </div>

                            {/* Reset */}
                            <button
                                onClick={() => {
                                    handleFontSizeChange(1);
                                    if (reduceMotion) toggleReduceMotion();
                                    if (highContrast) toggleHighContrast();
                                    if (colorBlindFriendly) toggleColorBlind();
                                }}
                                className="w-full text-xs text-center text-gray-400 hover:text-gray-600 transition-colors py-1"
                            >
                                {isVi ? 'Đặt lại mặc định' : 'Reset to defaults'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
