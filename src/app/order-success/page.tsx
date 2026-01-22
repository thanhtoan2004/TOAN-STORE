'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Order } from '@/types/auth';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        if (!orderNumber) {
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/orders/${orderNumber}`);
        
        if (!response.ok) {
          throw new Error('Order not found');
        }
        
        const data = await response.json();
        const order = data.order;
        
        setOrderData({
          id: order.id,
          orderNumber: order.order_number,
          userId: order.user_id,
          items: order.items || [],
          totalAmount: parseFloat(order.total),
          status: order.status,
          shippingAddress: {
            fullName: order.shipping_name || '',
            address: order.shipping_address || '',
            city: order.shipping_city || '',
            postalCode: order.shipping_postal_code || '',
            phone: order.shipping_phone || ''
          },
          paymentMethod: order.payment_method || 'Thanh toán khi nhận hàng',
          estimatedDelivery: order.estimated_delivery || 'Đang cập nhật',
          createdAt: order.placed_at,
          updatedAt: order.updated_at
        });
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error);
        setOrderData(null);
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrderData();
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xử lý đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!orderNumber || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lỗi</h2>
          <p className="text-gray-600 mb-6">Không tìm thấy thông tin đơn hàng</p>
          <Link href="/">
            <button className="shop-button">
              Về trang chủ
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-nike-futura mb-4">Đặt hàng thành công!</h1>
          <p className="text-gray-600 mb-8">
            Cảm ơn bạn đã mua hàng tại Nike. Chúng tôi đã nhận được đơn hàng của bạn và sẽ xử lý trong thời gian sớm nhất.
          </p>

          {/* Order Info */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="font-helvetica-medium text-lg mb-2">Thông tin đơn hàng</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Mã đơn hàng:</span> #{orderData.orderNumber}</p>
                  <p><span className="font-medium">Tổng tiền:</span> {formatPrice(orderData.totalAmount)}</p>
                  <p><span className="font-medium">Dự kiến giao hàng:</span> {orderData.estimatedDelivery}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-helvetica-medium text-lg mb-2">Bước tiếp theo</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Chúng tôi sẽ gửi email xác nhận đơn hàng</p>
                  <p>• Theo dõi đơn hàng qua tài khoản của bạn</p>
                  <p>• Chuẩn bị nhận hàng trong 2-3 ngày tới</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Confirmation for MoMo */}
          {orderData.paymentMethod?.includes('MoMo') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="font-helvetica-medium text-lg mb-3">💳 Xác Nhận Thanh Toán</h3>
              <p className="text-sm text-gray-700 mb-4">
                Sau khi đã chuyển khoản qua MoMo, vui lòng xác nhận thanh toán để đơn hàng được xử lý nhanh chóng.
              </p>
              <Link href="/payment-confirmation">
                <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                  Xác Nhận Đã Thanh Toán
                </button>
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link href={`/orders/${orderNumber}`}>
              <button className="shop-button">
                Xem chi tiết đơn hàng
              </button>
            </Link>
            <Link href="/orders">
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors">
                Xem tất cả đơn hàng
              </button>
            </Link>
            <Link href="/">
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors">
                Tiếp tục mua sắm
              </button>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-helvetica-medium text-lg mb-3">💡 Thông tin hữu ích</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• <strong>Chính sách đổi trả:</strong> 30 ngày đổi trả miễn phí</p>
              <p>• <strong>Hỗ trợ khách hàng:</strong> 1800-1234 (8:00 - 22:00, thứ 2 - chủ nhật)</p>
              <p>• <strong>Email hỗ trợ:</strong> support@nike.com</p>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-600 mb-4">Chia sẻ niềm vui với bạn bè:</p>
            <div className="flex justify-center space-x-4">
              <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </button>
              <button className="p-2 bg-blue-800 text-white rounded-full hover:bg-blue-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}