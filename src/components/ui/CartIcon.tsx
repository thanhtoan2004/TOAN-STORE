'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CartIcon() {
  const { cartCount, loading } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <Link href="/cart" className="relative group inline-block text-black">
      <div className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
        {/* Cart Icon */}
        <ShoppingCart className="w-6 h-6" />

        {/* Badge hiển thị số lượng */}
        {user && cartCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border-2 border-white z-20 min-w-[18px] px-1">
            {loading ? '...' : cartCount > 99 ? '99+' : cartCount}
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
        {t.cart.bag} ({cartCount})
      </div>
    </Link>
  );
}
