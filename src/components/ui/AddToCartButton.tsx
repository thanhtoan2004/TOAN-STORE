'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  productId: number;
  size?: string;
  color?: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function AddToCartButton({
  productId,
  size,
  color,
  quantity = 1,
  disabled = false,
  className = '',
  children
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showAlert } = useModal();
  const router = useRouter();

  const handleAddToCart = async () => {
    if (!user) {
      showAlert({
        title: 'Xác nhận thông tin',
        message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
        type: 'auth',
        onConfirm: () => router.push('/sign-in')
      });
      return;
    }

    setLoading(true);
    const success = await addToCart(productId, quantity, size, color);
    setLoading(false);

    if (success) {
      // Hiển thị thông báo thành công
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Đã thêm vào giỏ hàng!</span>
        </div>
      `;
      document.body.appendChild(notification);

      // Tự động xóa thông báo sau 3 giây
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden
        bg-black text-white font-medium
        px-6 py-4 rounded-full
        transition-all duration-300
        ${disabled || loading
          ? 'opacity-50 cursor-not-allowed bg-gray-400'
          : 'hover:bg-gray-800 active:bg-black hover:scale-[1.02]'
        }
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Đang thêm...</span>
        </div>
      ) : (
        children || (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.414 2.414A1 1 0 007 17h10" />
            </svg>
            <span>Thêm vào giỏ hàng</span>
          </div>
        )
      )}
    </button>
  );
}
