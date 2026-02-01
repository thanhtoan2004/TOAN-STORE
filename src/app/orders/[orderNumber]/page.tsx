'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

interface OrderItem {
  id: string;
  name: string;
  image: string;
  unit_price: number;
  total_price: number;
  size: string;
  color: string;
  quantity: number;
}

interface OrderData {
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  tax: number;
  discount: number;
  voucherCode: string | null;
  voucherDiscount: number;
  giftcardNumber: string | null;
  giftcardDiscount: number;
  finalTotal: number;
  estimatedDelivery: string;
  trackingNumber: string;
  paymentMethod: string;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
  };
  items: OrderItem[];
}



export default function OrderDetailPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/orders/${orderNumber}`);

        if (!response.ok) {
          throw new Error('Order not found');
        }

        const data = await response.json();
        const order = data.order;

        // Transform API data to match OrderData interface
        const transformedData: OrderData = {
          orderNumber: order.order_number,
          orderDate: new Date(order.placed_at).toLocaleDateString('vi-VN'),
          status: order.status === 'pending' ? 'Chờ xác nhận' :
            order.status === 'processing' ? 'Đã xác nhận' :
              order.status === 'shipped' ? 'Đang giao hàng' :
                order.status === 'delivered' ? 'Đã giao' :
                  order.status === 'cancelled' ? 'Đã hủy' : order.status,
          totalAmount: parseFloat(order.subtotal || 0),
          shippingFee: parseFloat(order.shipping_fee || 0),
          tax: parseFloat(order.tax || 0),
          discount: parseFloat(order.discount || 0),
          voucherCode: order.voucher_code || null,
          voucherDiscount: parseFloat(order.voucher_discount || 0),
          giftcardNumber: order.giftcard_number || null,
          giftcardDiscount: parseFloat(order.giftcard_discount || 0),
          finalTotal: parseFloat(order.total || 0),
          estimatedDelivery: order.estimated_delivery || 'Đang cập nhật',
          trackingNumber: order.tracking_number || 'Chưa có',
          paymentMethod: order.payment_method || 'Thanh toán khi nhận hàng',
          shippingAddress: {
            name: order.shipping_name || '',
            phone: order.shipping_phone || '',
            address: order.shipping_address || '',
            city: order.shipping_city || '',
            district: order.shipping_district || '',
            ward: ''
          },
          items: order.items?.map((item: any) => ({
            id: item.id.toString(),
            name: item.product_name || item.name,
            image: item.image || '/placeholder-product.png',
            unit_price: parseFloat(item.unit_price || 0),
            total_price: parseFloat(item.total_price || 0),
            size: item.size || 'N/A',
            color: item.color || 'N/A',
            quantity: item.quantity
          })) || []
        };

        setOrderData(transformedData);
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải thông tin đơn hàng:', error);
        setOrderData(null);
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrderData();
    }
  }, [orderNumber]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Chờ xác nhận':
        return 'bg-yellow-100 text-yellow-800';
      case 'Đã xác nhận':
        return 'bg-blue-100 text-blue-800';
      case 'Đang giao hàng':
        return 'bg-purple-100 text-purple-800';
      case 'Đã giao':
        return 'bg-green-100 text-green-800';
      case 'Đã hủy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleCancelOrder = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

    try {
      setCancelling(true);
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      const result = await response.json();
      if (result.success) {
        alert('Đã hủy đơn hàng thành công');
        window.location.reload();
      } else {
        alert(result.message || 'Không thể hủy đơn hàng');
      }
    } catch (error) {
      console.error('Lỗi khi hủy đơn hàng:', error);
      alert('Lỗi khi hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-6">Đơn hàng với mã số {orderNumber} không tồn tại.</p>
          <Link href="/orders">
            <button className="shop-button">
              Xem tất cả đơn hàng
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="nike-container py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/orders" className="text-blue-600 hover:text-blue-800 flex items-center mb-2">
                ← Quay lại danh sách đơn hàng
              </Link>
              <h1 className="text-3xl font-bold">Chi tiết đơn hàng #{orderData.orderNumber}</h1>
              <p className="text-gray-600">Đặt hàng ngày {orderData.orderDate}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
                {orderData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="nike-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-6">Trạng thái đơn hàng</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
                  <div>
                    <p className="font-medium">Đơn hàng đã được xác nhận</p>
                    <p className="text-sm text-gray-600">{orderData.orderDate}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
                  <div>
                    <p className="font-medium">Đang vận chuyển</p>
                    <p className="text-sm text-gray-600">Mã vận đơn: {orderData.trackingNumber}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-300 rounded-full mr-4"></div>
                  <div>
                    <p className="font-medium text-gray-500">Dự kiến giao hàng</p>
                    <p className="text-sm text-gray-600">{orderData.estimatedDelivery}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-6">Sản phẩm đã đặt ({orderData.items.length} sản phẩm)</h2>
              <div className="space-y-4">
                {orderData.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-helvetica-medium text-lg">{item.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Kích thước: {item.size}</p>
                        <p>Màu sắc: {item.color}</p>
                        <p>Số lượng: {item.quantity}</p>
                        <p>Đơn giá: {formatPrice(item.unit_price)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-helvetica-medium text-lg">{formatPrice(item.total_price)}</p>
                      <p className="text-sm text-gray-600">({item.quantity} × {formatPrice(item.unit_price)})</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-6">Thông tin giao hàng</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Người nhận:</span> {orderData.shippingAddress.name}</p>
                <p><span className="font-medium">Số điện thoại:</span> {orderData.shippingAddress.phone}</p>
                <p><span className="font-medium">Địa chỉ:</span> {orderData.shippingAddress.address}</p>
                <p><span className="font-medium">Phường/Xã:</span> {orderData.shippingAddress.ward}</p>
                <p><span className="font-medium">Quận/Huyện:</span> {orderData.shippingAddress.district}</p>
                <p><span className="font-medium">Tỉnh/Thành phố:</span> {orderData.shippingAddress.city}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-6">Tóm tắt đơn hàng</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Tổng tiền hàng:</span>
                  <span>{formatPrice(orderData.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>{formatPrice(orderData.shippingFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thuế VAT:</span>
                  <span>{formatPrice(orderData.tax)}</span>
                </div>
                {orderData.voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá Voucher ({orderData.voucherCode}):</span>
                    <span>-{formatPrice(orderData.voucherDiscount)}</span>
                  </div>
                )}
                {orderData.giftcardDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Thẻ quà tặng (****{orderData.giftcardNumber?.slice(-4)}):</span>
                    <span>-{formatPrice(orderData.giftcardDiscount)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-helvetica-medium text-lg">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(orderData.finalTotal)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-4">Phương thức thanh toán</h2>
              <p className="text-gray-700">{orderData.paymentMethod}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-4">Hành động</h2>
              <div className="space-y-3">
                <Link href={`/orders/${orderNumber}`}>
                  <button className="w-full border border-black text-black py-2 px-4 rounded-full hover:bg-black hover:text-white transition-colors">
                    Theo dõi đơn hàng
                  </button>
                </Link>
                <Link href="/help/contact">
                  <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-full hover:bg-gray-50 transition-colors">
                    Liên hệ hỗ trợ
                  </button>
                </Link>
                {orderData.status === 'Chờ xác nhận' && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="w-full border border-red-500 text-red-500 py-2 px-4 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-4">Mua lại</h2>
              <Link href="/cart">
                <button className="w-full shop-button">
                  Đặt lại đơn hàng này
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



