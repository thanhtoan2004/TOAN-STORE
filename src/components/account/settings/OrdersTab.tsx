'use client';

import React from 'react';
import Link from 'next/link';

export default function OrdersTab() {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6">Cài đặt đơn hàng</h2>
            <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Thông báo trạng thái đơn hàng</h3>
                    <p className="text-sm text-gray-600 mb-3">Nhận thông báo khi đơn hàng của bạn được cập nhật</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm">Bật thông báo email</span>
                    </label>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Quản lý đơn hàng</h3>
                    <p className="text-sm text-gray-600 mb-3">Xem và quản lý tất cả đơn hàng của bạn</p>
                    <Link href="/orders">
                        <button className="px-6 py-2 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors">
                            Xem đơn hàng
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
