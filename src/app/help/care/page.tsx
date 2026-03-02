'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, CloudRain, Sun, Wind, Droplets, RefreshCw } from 'lucide-react';

export default function ProductCarePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="toan-container py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                        <Link href="/help" className="hover:text-black">Trợ Giúp</Link>
                        <span>/</span>
                        <span className="text-black font-medium">Bảo Quản</span>
                    </div>

                    <h1 className="text-4xl font-bold mb-6">Hướng Dẫn Bảo Quản</h1>
                    <p className="text-gray-600 mb-8 text-lg">
                        Giữ cho giày và trang phục của bạn luôn mới với các mẹo chăm sóc từ chuyên gia.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white rounded-lg p-8 shadow-sm">
                            <h2 className="text-xl font-helvetica-medium mb-4 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-yellow-500" />
                                Vệ Sinh Giày
                            </h2>
                            <ul className="space-y-4 text-gray-700">
                                <li>• Làm sạch vết bẩn ngay khi xuất hiện bằng khăn mềm ẩm.</li>
                                <li>• Dùng bàn chải mềm và dung dịch xà phòng nhẹ cho đế giày.</li>
                                <li>• Tháo lót giày và dây giày giặt riêng để sạch hơn.</li>
                                <li>• <strong>KHÔNG</strong> giặt giày trong máy giặt hoặc sấy khô bằng máy.</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-lg p-8 shadow-sm">
                            <h2 className="text-xl font-helvetica-medium mb-4 flex items-center gap-2">
                                <CloudRain className="w-6 h-6 text-blue-500" />
                                Bảo Quản
                            </h2>
                            <ul className="space-y-4 text-gray-700">
                                <li>• Để giày ở nơi khô thoáng, tránh ánh nắng trực tiếp.</li>
                                <li>• Nhét giấy báo vào trong giày để giữ phom dáng khi không sử dụng.</li>
                                <li>• Sử dụng chai xịt chống thấm nước nếu thường xuyên đi mưa.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-8 shadow-sm">
                        <h2 className="text-2xl font-helvetica-medium mb-6">Mẹo Vặt</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                                <Wind className="w-8 h-8 mb-2 text-gray-700" />
                                <h3 className="font-bold mb-2">Phơi Khô Tự Nhiên</h3>
                                <p className="text-sm text-gray-600">Luôn phơi giày khô tự nhiên ở nhiệt độ phòng. Tránh máy sấy gắt.</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                                <Droplets className="w-8 h-8 mb-2 text-blue-500" />
                                <h3 className="font-bold mb-2">Xà Phòng Nhẹ</h3>
                                <p className="text-sm text-gray-600">Tránh các chất tẩy rửa mạnh có thể làm hỏng keo và chất liệu.</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                                <RefreshCw className="w-8 h-8 mb-2 text-green-500" />
                                <h3 className="font-bold mb-2">Luân Phiên</h3>
                                <p className="text-sm text-gray-600">Nên có ít nhất 2 đôi giày để thay đổi, giúp giày có thời gian "nghỉ".</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
