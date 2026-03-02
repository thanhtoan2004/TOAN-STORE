'use client';

import React from 'react';
import Link from 'next/link';
import { CreditCard, Building2, Wallet } from 'lucide-react';

export default function PaymentTab() {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6">Thanh toán</h2>
            <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Phương thức thanh toán</h3>
                    <p className="text-sm text-gray-600 mb-4">Quản lý các phương thức thanh toán của bạn</p>
                    <div className="space-y-2">
                        <div
                            onClick={() => alert('Chức năng thêm thẻ tín dụng đang được phát triển.')}
                            className="p-3 border rounded bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-gray-600" />
                                <div>
                                    <p className="text-sm font-medium">Thẻ tín dụng / Ghi nợ</p>
                                    <p className="text-xs text-gray-500">Thêm hoặc quản lý thẻ của bạn</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-blue-600">Sắp ra mắt</span>
                        </div>
                        <div
                            onClick={() => alert('Chức năng liên kết ngân hàng đang được phát triển.')}
                            className="p-3 border rounded bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-gray-600" />
                                <div>
                                    <p className="text-sm font-medium">Chuyển khoản ngân hàng</p>
                                    <p className="text-xs text-gray-500">Thanh toán trực tiếp từ tài khoản ngân hàng</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-blue-600">Sắp ra mắt</span>
                        </div>
                        <div
                            onClick={() => alert('Chức năng liên kết ví điện tử đang được phát triển.')}
                            className="p-3 border rounded bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Wallet className="w-5 h-5 text-gray-600" />
                                <div>
                                    <p className="text-sm font-medium">Ví điện tử</p>
                                    <p className="text-xs text-gray-500">Liên kết ví điện tử của bạn</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-blue-600">Sắp ra mắt</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Lịch sử giao dịch</h3>
                    <p className="text-sm text-gray-600 mb-3">Xem lịch sử thanh toán và giao dịch của bạn</p>
                    <Link href="/gift-card-balance">
                        <button className="px-6 py-2 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors">
                            Xem lịch sử
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
