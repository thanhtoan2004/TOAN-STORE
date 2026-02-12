'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Order } from '@/types/auth'; // Ensure this type exists or adjust import
import { Button } from "@/components/ui/Button";
import { CheckCircle, Facebook, Twitter, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/date-utils';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  // Define Order interface locally if not available in types/auth to be safe, 
  // or use any if strict typing is an issue, but better to stick to existing patterns.
  // Assuming Order type matches what we need based on previous file content.
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

  // local formatPrice removed, using import from @/lib/date-utils

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
            <Button className="rounded-full">
              Về trang chủ
            </Button>
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
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold mb-4">Đặt hàng thành công!</h1>
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
                  <p><span className="font-medium">Tổng tiền:</span> {formatCurrency(orderData.totalAmount)}</p>
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
              <h3 className="font-helvetica-medium text-lg mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Xác Nhận Thanh Toán
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Sau khi đã chuyển khoản qua MoMo, vui lòng xác nhận thanh toán để đơn hàng được xử lý nhanh chóng.
              </p>
              <Link href="/payment-confirmation">
                <Button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                  Xác Nhận Đã Thanh Toán
                </Button>
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link href={`/orders/${orderNumber}`}>
              <Button className="rounded-full">
                Xem chi tiết đơn hàng
              </Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50">
                Xem tất cả đơn hàng
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50">
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-helvetica-medium text-lg mb-3">Thông tin hữu ích</h3>
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
              <Button variant="ghost" size="icon" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="p-2 bg-blue-800 text-white rounded-full hover:bg-blue-900 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Button>
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