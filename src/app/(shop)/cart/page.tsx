'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CartPage() {
  const { 
    cartItems, 
    loading, 
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCart();
  const { user } = useAuth();
  const [updating, setUpdating] = useState<number | null>(null);

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = cartItems.find(item => item.id === itemId);
    if (!item || newQuantity > item.stock) return;

    setUpdating(itemId);
    const success = await updateQuantity(itemId, newQuantity);
    setUpdating(null);

    if (!success) {
      // Error được handle trong context
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setUpdating(itemId);
    const success = await removeItem(itemId);
    setUpdating(null);

    if (!success) {
      // Error được handle trong context
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) return;

    const success = await clearCart();
    if (!success) {
      // Error được handle trong context
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = subtotal > 1000000 ? 0 : 30000; // Miễn phí ship cho đơn > 1 triệu
  const tax = Math.round(subtotal * 0.1); // VAT 10%
  const total = subtotal + shippingFee + tax;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem giỏ hàng</p>
          <Link href="/sign-in">
            <button className="shop-button">
              Đăng nhập
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="nike-container py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-nike-futura mb-2">Giỏ hàng của bạn</h1>
              <p className="text-gray-600">
                {cartItems.length > 0 
                  ? `${cartItems.length} sản phẩm trong giỏ hàng`
                  : 'Giỏ hàng trống'
                }
              </p>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>

      <div className="nike-container py-8">
        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🛒</span>
            </div>
            <h2 className="text-2xl font-helvetica-medium mb-4">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-8">Hãy thêm một số sản phẩm vào giỏ hàng để bắt đầu mua sắm!</p>
            <div className="space-y-4">
              <Link href="/men">
                <button className="shop-button mr-4">
                  Sản phẩm Nam
                </button>
              </Link>
              <Link href="/women">
                <button className="shop-button">
                  Sản phẩm Nữ
                </button>
              </Link>
            </div>
          </div>
        ) : (
          // Cart with Items
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-helvetica-medium">Sản phẩm trong giỏ hàng</h2>
                    <button 
                      onClick={handleClearCart}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                </div>
                <div className="divide-y">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Product Image */}
                        <Link href={`/products/${item.productId}`}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1">
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="font-helvetica-medium text-lg hover:text-blue-600 cursor-pointer">
                              {item.name}
                            </h3>
                          </Link>
                          
                          <div className="text-sm text-gray-600 space-y-1 mt-1">
                            {item.size && <p>Kích thước: {item.size}</p>}
                            {item.color && <p>Màu sắc: {item.color}</p>}
                            <p>Còn lại: {item.stock} sản phẩm</p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center border rounded-lg">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updating === item.id}
                                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <span className="px-4 py-2 min-w-[60px] text-center">
                                {updating === item.id ? '...' : item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock || updating === item.id}
                                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="font-helvetica-medium text-lg">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-sm text-gray-600">
                                  {formatPrice(item.price)} x {item.quantity}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={updating === item.id}
                            className="mt-3 text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                          >
                            {updating === item.id ? 'Đang xóa...' : 'Xóa sản phẩm'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
                <h2 className="text-xl font-helvetica-medium mb-6">Tóm tắt đơn hàng</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Tạm tính ({cartItems.length} sản phẩm):</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        formatPrice(shippingFee)
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Thuế VAT (10%):</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  
                  {shippingFee === 0 && subtotal < 1000000 && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                      🎉 Bạn được miễn phí vận chuyển cho đơn hàng này!
                    </div>
                  )}
                  
                  {shippingFee > 0 && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                      💡 Mua thêm {formatPrice(1000000 - subtotal)} để được miễn phí vận chuyển!
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="flex justify-between font-helvetica-medium text-lg">
                    <span>Tổng cộng:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Link href="/checkout">
                    <button className="w-full shop-button text-lg py-3">
                      Tiến hành thanh toán
                    </button>
                  </Link>
                  
                  <Link href="/">
                    <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-full hover:bg-gray-50 transition-colors">
                      Tiếp tục mua sắm
                    </button>
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center text-sm text-gray-600">
                    <div>
                      <div className="mb-2">🚚</div>
                      <p>Giao hàng nhanh</p>
                    </div>
                    <div>
                      <div className="mb-2">🔒</div>
                      <p>Thanh toán an toàn</p>
                    </div>
                    <div>
                      <div className="mb-2">↩️</div>
                      <p>Đổi trả dễ dàng</p>
                    </div>
                    <div>
                      <div className="mb-2">📞</div>
                      <p>Hỗ trợ 24/7</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




