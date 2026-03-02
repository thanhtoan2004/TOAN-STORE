'use client';

import React from 'react';

interface AppearanceTabProps {
    currentLang: string;
    setLanguage: (lang: 'vi' | 'en') => void;
    t: any;
}

export default function AppearanceTab({
    currentLang,
    setLanguage,
    t
}: AppearanceTabProps) {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6">{t.common.appearance}</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-3">{t.common.language}</label>
                    <select
                        value={currentLang}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black outline-none"
                    >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                    </select>
                </div>

                <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-3">Trợ năng (Accessibility)</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                defaultChecked={typeof window !== 'undefined' && localStorage.getItem('highContrast') === 'true'}
                                onChange={(e) => {
                                    document.documentElement.classList.toggle('high-contrast', e.target.checked);
                                    localStorage.setItem('highContrast', String(e.target.checked));
                                }}
                                className="w-4 h-4"
                            />
                            <div>
                                <span className="text-sm font-medium">Chế độ tương phản cao</span>
                                <p className="text-xs text-gray-500">Tăng độ tương phản cho văn bản và viền để dễ đọc hơn</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                defaultChecked={typeof window !== 'undefined' && localStorage.getItem('colorBlindFriendly') === 'true'}
                                onChange={(e) => {
                                    document.documentElement.classList.toggle('color-blind-friendly', e.target.checked);
                                    localStorage.setItem('colorBlindFriendly', String(e.target.checked));
                                }}
                                className="w-4 h-4"
                            />
                            <div>
                                <span className="text-sm font-medium">Chế độ thân thiện người mù màu</span>
                                <p className="text-xs text-gray-500">Điều chỉnh bảng màu phù hợp hơn cho người khó phân biệt Đỏ-Xanh (Deuteranopia)</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
