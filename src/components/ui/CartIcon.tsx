'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CartIcon() {
  const { cartCount, loading } = useCart();
  const { user } = useAuth();

  return (
    <Link href="/cart" className="relative inline-block">
      <div className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
        {/* Cart Icon */}
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.414 2.414A1 1 0 007 17h10M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20.5 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" 
          />
        </svg>
        
        {/* Badge hiển thị số lượng */}
        {user && cartCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {loading ? '...' : cartCount > 99 ? '99+' : cartCount}
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Giỏ hàng ({cartCount})
      </div>
    </Link>
  );
}
