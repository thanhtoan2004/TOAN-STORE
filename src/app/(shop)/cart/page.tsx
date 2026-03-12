'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModal } from '@/contexts/ModalContext';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Truck, ShieldCheck, PartyPopper, Lightbulb } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/date-utils';

export default function CartPage() {
  const { t } = useLanguage();
  const { cartItems, loading, updateQuantity, removeItem, clearCart } = useCart();
  const { showAlert } = useModal();
  const { user } = useAuth();
  const [updating, setUpdating] = useState<number | null>(null);

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = cartItems.find((item) => item.id === itemId);
    if (!item || newQuantity > item.stock) return;

    await updateQuantity(itemId, newQuantity);
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
    showAlert({
      title: 'Xác nhận xóa giỏ hàng',
      message: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng không?',
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy',
      onConfirm: async () => {
        const success = await clearCart();
        if (!success) {
          // Error được handle trong context
        }
      },
    });
  };

  // local formatPrice removed, using import from @/lib/date-utils

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal > 1000000 ? 0 : 30000; // Miễn phí ship cho đơn > 1 triệu
  const tax = Math.round(subtotal * 0.1); // VAT 10%
  const total = subtotal + shippingFee + tax;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t.common.login}</h2>
          <p className="text-gray-600 mb-6">{t.auth.sign_in_title}</p>
          <Link href="/sign-in">
            <Button className="rounded-full px-6 py-6">{t.common.login}</Button>
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
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="toan-container py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.cart.bag}</h1>
              <p className="text-gray-600">
                {cartItems.length > 0 ? `${cartItems.length} ${t.orders.items}` : t.cart.empty}
              </p>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← {t.common.product || 'Shop'}
            </Link>
          </div>
        </div>
      </div>

      <div className="toan-container py-8">
        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-helvetica-medium mb-4">{t.cart.empty}</h2>
            <p className="text-gray-600 mb-8">{t.cart.empty_desc}</p>
            <div className="space-y-4">
              <Link href="/men">
                <Button className="rounded-full px-6 py-6 mr-4">{t.cart.shop_men}</Button>
              </Link>
              <Link href="/women">
                <Button className="rounded-full px-6 py-6">{t.cart.shop_women}</Button>
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
                    <h2 className="text-xl font-helvetica-medium">{t.cart.bag}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCart}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      {t.cart.remove}
                    </Button>
                  </div>
                </div>
                <div className="divide-y">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6 cart-item">
                      <div className="flex items-start space-x-4">
                        {/* Product Image */}
                        <Link href={`/products/${item.slug || item.productId}`}>
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
                          <Link href={`/products/${item.slug || item.productId}`}>
                            <h3 className="font-helvetica-medium text-lg hover:text-blue-600 cursor-pointer">
                              {item.name}
                            </h3>
                          </Link>

                          <div className="text-sm text-gray-600 space-y-1 mt-1">
                            {item.size && (
                              <p>
                                {t.cart.size}: {item.size}
                              </p>
                            )}
                            {item.color && (
                              <p>
                                {t.common.color || 'Color'}: {item.color}
                              </p>
                            )}
                            <p>
                              {t.product.left_in_stock}: {item.stock}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center border rounded-lg bg-gray-50/50">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 p-0 rounded-none hover:bg-gray-200 transition-colors"
                              >
                                -
                              </Button>
                              <span className="px-4 py-2 min-w-[50px] text-center font-medium tabular-nums border-x">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="h-8 w-8 p-0 rounded-none hover:bg-gray-200 transition-colors"
                              >
                                +
                              </Button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="font-helvetica-medium text-lg">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-sm text-gray-600">
                                  {formatCurrency(item.price)} x {item.quantity}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={updating === item.id}
                            className="mt-2 text-red-600 hover:text-red-800 p-0 h-auto font-normal"
                          >
                            {updating === item.id ? t.common.loading : t.cart.remove}
                          </Button>
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
                <h2 className="text-xl font-helvetica-medium mb-6">{t.cart.summary}</h2>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>
                      {t.cart.subtotal} ({cartItems.length} {t.orders.items}):
                    </span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>{t.cart.shipping}:</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-green-600">{t.checkout.free}</span>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>{t.cart.estimated_tax} (10%):</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>

                  {shippingFee === 0 && subtotal < 1000000 && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded flex items-center">
                      <PartyPopper className="w-4 h-4 mr-2" />
                      {t.cart.free_shipping_msg}
                    </div>
                  )}

                  {shippingFee > 0 && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {t.cart.free_shipping_msg}{' '}
                      {/* Simplify logic for now, or add specific key if needed */}
                    </div>
                  )}

                  <hr />

                  <div className="flex justify-between font-helvetica-medium text-lg">
                    <span>{t.cart.total}:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Link href="/checkout">
                    <Button className="w-full text-lg py-6 rounded-full" size="lg">
                      {t.cart.checkout}
                    </Button>
                  </Link>

                  <Link href="/">
                    <Button
                      variant="outline"
                      className="w-full text-lg py-6 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      size="lg"
                    >
                      {t.orders.shop_now}
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center text-sm text-gray-600">
                    <div>
                      <div className="mb-2 flex justify-center">
                        <Truck className="w-6 h-6" />
                      </div>
                      <p>{t.footer.shipping}</p>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-center">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <p>{t.common.security}</p>
                    </div>
                    {/* ... other icons ... */}
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
