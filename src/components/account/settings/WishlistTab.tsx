'use client';

import React from 'react';
import Link from 'next/link';

export default function WishlistTab() {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6">Wishlist</h2>
            <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Cài đặt Wishlist</h3>
                    <p className="text-sm text-gray-600 mb-3">Quản lý sản phẩm yêu thích của bạn</p>
                    <Link href="/wishlist">
                        <button className="px-6 py-2 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors">
                            Xem Wishlist
                        </button>
                    </Link>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Chia sẻ Wishlist</h3>
                    <p className="text-sm text-gray-600 mb-3">Chia sẻ wishlist với bạn bè hoặc gia đình</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-sm">Cho phép chia sẻ công khai</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
