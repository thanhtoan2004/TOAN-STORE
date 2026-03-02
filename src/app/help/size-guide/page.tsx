'use client';

import React from 'react';
import Link from 'next/link';
import { Ruler, Info, CheckCircle } from 'lucide-react';

export default function SizeGuidePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="toan-container py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                        <Link href="/help" className="hover:text-black">Trợ Giúp</Link>
                        <span>/</span>
                        <span className="text-black font-medium">Chọn Size</span>
                    </div>

                    <h1 className="text-4xl font-bold mb-6">Hướng Dẫn Chọn Size</h1>
                    <p className="text-gray-600 mb-8 text-lg">
                        Tìm size giày hoàn hảo của bạn với bảng chuyển đổi size chuẩn của TOAN Store.
                    </p>

                    <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
                        <h2 className="text-2xl font-helvetica-medium mb-6 flex items-center gap-2">
                            <Ruler className="w-6 h-6" />
                            Bảng Size Giày Nam/Nữ (Unisex)
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 uppercase font-medium">
                                    <tr>
                                        <th className="px-4 py-3">US Men</th>
                                        <th className="px-4 py-3">US Women</th>
                                        <th className="px-4 py-3">UK</th>
                                        <th className="px-4 py-3">EU</th>
                                        <th className="px-4 py-3">CM (Chiều dài chân)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr><td className="px-4 py-3">3.5</td><td className="px-4 py-3">5</td><td className="px-4 py-3">3</td><td className="px-4 py-3">35.5</td><td className="px-4 py-3">22.5</td></tr>
                                    <tr><td className="px-4 py-3">4</td><td className="px-4 py-3">5.5</td><td className="px-4 py-3">3.5</td><td className="px-4 py-3">36</td><td className="px-4 py-3">23</td></tr>
                                    <tr><td className="px-4 py-3">4.5</td><td className="px-4 py-3">6</td><td className="px-4 py-3">4</td><td className="px-4 py-3">36.5</td><td className="px-4 py-3">23.5</td></tr>
                                    <tr><td className="px-4 py-3">5</td><td className="px-4 py-3">6.5</td><td className="px-4 py-3">4.5</td><td className="px-4 py-3">37.5</td><td className="px-4 py-3">23.5</td></tr>
                                    <tr><td className="px-4 py-3">5.5</td><td className="px-4 py-3">7</td><td className="px-4 py-3">5</td><td className="px-4 py-3">38</td><td className="px-4 py-3">24</td></tr>
                                    <tr><td className="px-4 py-3">6</td><td className="px-4 py-3">7.5</td><td className="px-4 py-3">5.5</td><td className="px-4 py-3">38.5</td><td className="px-4 py-3">24</td></tr>
                                    <tr><td className="px-4 py-3">6.5</td><td className="px-4 py-3">8</td><td className="px-4 py-3">6</td><td className="px-4 py-3">39</td><td className="px-4 py-3">24.5</td></tr>
                                    <tr><td className="px-4 py-3">7</td><td className="px-4 py-3">8.5</td><td className="px-4 py-3">6</td><td className="px-4 py-3">40</td><td className="px-4 py-3">25</td></tr>
                                    <tr><td className="px-4 py-3">7.5</td><td className="px-4 py-3">9</td><td className="px-4 py-3">6.5</td><td className="px-4 py-3">40.5</td><td className="px-4 py-3">25.5</td></tr>
                                    <tr><td className="px-4 py-3">8</td><td className="px-4 py-3">9.5</td><td className="px-4 py-3">7</td><td className="px-4 py-3">41</td><td className="px-4 py-3">26</td></tr>
                                    <tr><td className="px-4 py-3">8.5</td><td className="px-4 py-3">10</td><td className="px-4 py-3">7.5</td><td className="px-4 py-3">42</td><td className="px-4 py-3">26.5</td></tr>
                                    <tr><td className="px-4 py-3">9</td><td className="px-4 py-3">10.5</td><td className="px-4 py-3">8</td><td className="px-4 py-3">42.5</td><td className="px-4 py-3">27</td></tr>
                                    <tr><td className="px-4 py-3">9.5</td><td className="px-4 py-3">11</td><td className="px-4 py-3">8.5</td><td className="px-4 py-3">43</td><td className="px-4 py-3">27.5</td></tr>
                                    <tr><td className="px-4 py-3">10</td><td className="px-4 py-3">11.5</td><td className="px-4 py-3">9</td><td className="px-4 py-3">44</td><td className="px-4 py-3">28</td></tr>
                                    <tr><td className="px-4 py-3">10.5</td><td className="px-4 py-3">12</td><td className="px-4 py-3">9.5</td><td className="px-4 py-3">44.5</td><td className="px-4 py-3">28.5</td></tr>
                                    <tr><td className="px-4 py-3">11</td><td className="px-4 py-3">12.5</td><td className="px-4 py-3">10</td><td className="px-4 py-3">45</td><td className="px-4 py-3">29</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-8 shadow-sm">
                        <h2 className="text-2xl font-helvetica-medium mb-6 flex items-center gap-2">
                            <Info className="w-6 h-6" />
                            Cách Đo Chân
                        </h2>
                        <div className="space-y-4 text-gray-700">
                            <p>Để có kết quả tốt nhất, hãy đo chân vào cuối ngày khi chân bạn giãn nở tối đa.</p>
                            <ul className="list-none space-y-3">
                                <li className="flex gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Mang loại tất (vớ) mà bạn dự định sẽ mang với giày mới.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Đứng thẳng trên một bề mặt cứng với gót chân dựa vào tường.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Đo từ gót chân đến ngón chân dài nhất của bạn.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
