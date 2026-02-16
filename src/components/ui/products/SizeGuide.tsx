'use client';

import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

const sizeData = [
    { us: '6', uk: '5.5', eu: '38.5', cm: '24' },
    { us: '6.5', uk: '6', eu: '39', cm: '24.5' },
    { us: '7', uk: '6', eu: '40', cm: '25' },
    { us: '7.5', uk: '6.5', eu: '40.5', cm: '25.5' },
    { us: '8', uk: '7', eu: '41', cm: '26' },
    { us: '8.5', uk: '7.5', eu: '42', cm: '26.5' },
    { us: '9', uk: '8', eu: '42.5', cm: '27' },
    { us: '9.5', uk: '8.5', eu: '43', cm: '27.5' },
    { us: '10', uk: '9', eu: '44', cm: '28' },
    { us: '10.5', uk: '9.5', eu: '44.5', cm: '28.5' },
    { us: '11', uk: '10', eu: '45', cm: '29' },
    { us: '11.5', uk: '10.5', eu: '45.5', cm: '29.5' },
    { us: '12', uk: '11', eu: '46', cm: '30' },
];

export default function SizeGuide({ isOpen, onClose }: SizeGuideProps) {
    const [footLength, setFootLength] = useState<string>('');
    const [suggestedSize, setSuggestedSize] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        const length = parseFloat(footLength);
        if (isNaN(length)) return;

        // Simple logic: find the first CM that is >= foot length
        const suggestion = sizeData.find(s => parseFloat(s.cm) >= length);
        if (suggestion) {
            setSuggestedSize(suggestion.us);
        } else {
            setSuggestedSize('Out of range');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl relative shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-nike-futura font-bold uppercase">Bảng quy đổi kích cỡ Nike</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8 flex-1">
                    {/* Measurement Tool */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Ruler className="w-5 h-5 text-black" />
                            <h3 className="font-bold text-lg">Tìm size theo chiều dài bàn chân</h3>
                        </div>
                        <form onSubmit={handleCalculate} className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm text-gray-500">Chiều dài bàn chân (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={footLength}
                                    onChange={(e) => setFootLength(e.target.value)}
                                    placeholder="Ví dụ: 25.5"
                                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-black outline-none transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all active:scale-95"
                            >
                                Tính toán
                            </button>
                        </form>
                        {suggestedSize && (
                            <div className="mt-4 p-4 bg-black text-white rounded-lg flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                                <span>Size gợi ý của bạn (US):</span>
                                <span className="text-2xl font-bold">{suggestedSize}</span>
                            </div>
                        )}
                        <p className="mt-4 text-xs text-gray-400 italic">
                            * Gợi ý chỉ mang tính chất tham khảo. Đối với chân bè ngang, bạn nên tăng thêm 0.5 - 1 size.
                        </p>
                    </div>

                    {/* Table */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">Bảng size chuẩn (Unisex)</h3>
                        <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-sm">US (M)</th>
                                        <th className="px-4 py-3 font-bold text-sm">UK</th>
                                        <th className="px-4 py-3 font-bold text-sm">EU</th>
                                        <th className="px-4 py-3 font-bold text-sm">CM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sizeData.map((item, index) => (
                                        <tr key={index} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm">{item.us}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{item.uk}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{item.eu}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{item.cm} cm</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
}
