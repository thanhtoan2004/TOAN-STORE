'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState } from 'react';
import SearchOverlay from '@/components/search/SearchOverlay';

/**
 * Bottom Navigation Bar — Thanh điều hướng cố định ở đáy màn hình cho Mobile.
 * Chỉ hiển thị trên màn hình < 768px (md breakpoint).
 * Bao gồm: Home, Tìm kiếm, Wishlist, Giỏ hàng, Tài khoản.
 */
export default function BottomNavBar() {
    const pathname = usePathname() || '';
    const router = useRouter();
    const { cartItems } = useCart();
    const { user } = useAuth();
    const { wishlist } = useWishlist();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Ẩn bottom nav trên trang admin và checkout
    if (pathname.startsWith('/admin') || pathname === '/checkout') return null;

    const navItems = [
        {
            label: 'Trang chủ',
            href: '/',
            icon: Home,
            isActive: pathname === '/',
        },
        {
            label: 'Tìm kiếm',
            href: '#search',
            icon: Search,
            isActive: false,
            onClick: () => setIsSearchOpen(true),
        },
        {
            label: 'Yêu thích',
            href: '/wishlist',
            icon: Heart,
            isActive: pathname === '/wishlist',
            badge: wishlist.length > 0 ? wishlist.length : undefined,
        },
        {
            label: 'Giỏ hàng',
            href: '/cart',
            icon: ShoppingBag,
            isActive: pathname === '/cart',
            badge: cartCount > 0 ? cartCount : undefined,
        },
        {
            label: 'Tài khoản',
            href: user ? '/account/settings' : '/sign-in',
            icon: User,
            isActive: pathname.startsWith('/account'),
        },
    ];

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.isActive;

                        const content = (
                            <div className="flex flex-col items-center justify-center gap-0.5 relative">
                                <div className="relative">
                                    <Icon
                                        className={`w-5 h-5 transition-colors ${isActive ? 'text-black' : 'text-gray-400'
                                            }`}
                                        strokeWidth={isActive ? 2.5 : 1.5}
                                    />
                                    {item.badge && (
                                        <span className="absolute -top-1.5 -right-2 bg-black text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`text-[10px] transition-colors ${isActive ? 'text-black font-medium' : 'text-gray-400'
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </div>
                        );

                        if (item.onClick) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={item.onClick}
                                    className="flex-1 flex items-center justify-center py-2 active:bg-gray-50 transition-colors"
                                >
                                    {content}
                                </button>
                            );
                        }

                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    if (item.href) {
                                        router.push(item.href);
                                    }
                                }}
                                className="flex-1 flex items-center justify-center py-2 active:bg-gray-50 transition-colors"
                            >
                                {content}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Spacer to prevent content being hidden behind bottom nav on mobile */}
            <div className="h-16 md:hidden" />

            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
