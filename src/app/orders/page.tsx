'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Order {
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  previewImage: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user info from API to ensure it's always up-to-date
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          setError('Vui lòng đăng nhập để xem đơn hàng');
          setLoading(false);
          return;
        }
        
        const userData = await userResponse.json();
        console.log('User data:', userData);
        const response = await fetch(`/api/orders?userId=${userData.user.id}`);
        console.log('Orders API response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Orders API error:', errorData);
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        console.log('Orders data:', data);
        
        // Transform API data to match Order interface
        const transformedOrders = data.orders?.map((order: any) => ({
          orderNumber: order.order_number,
          orderDate: new Date(order.placed_at).toLocaleDateString('vi-VN'),
          status: order.status === 'pending' ? 'Chờ xác nhận' :
                 order.status === 'processing' ? 'Đã xác nhận' :
                 order.status === 'shipped' ? 'Đang giao hàng' :
                 order.status === 'delivered' ? 'Đã giao' :
                 order.status === 'cancelled' ? 'Đã hủy' : order.status,
          totalAmount: parseFloat(order.total),
          itemCount: order.item_count || 0,
          previewImage: order.preview_image || '/placeholder-product.png'
        })) || [];
        
        setOrders(transformedOrders);
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải danh sách đơn hàng:', error);
        setError('Có lỗi xảy ra khi tải danh sách đơn hàng');
        setOrders([]);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/sign-in" className="text-black underline hover:no-underline">
            Đăng nhập ngay
          </Link>
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
              <h1 className="text-3xl font-nike-futura mb-2">Đơn hàng của tôi</h1>
              <p className="text-gray-600">Quản lý và theo dõi các đơn hàng của bạn</p>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </div>

      <div className="nike-container py-8">
        {orders.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
            <h2 className="text-2xl font-helvetica-medium mb-4">Chưa có đơn hàng nào</h2>
            <p className="text-gray-600 mb-8">Bạn chưa có đơn hàng nào. Hãy khám phá các sản phẩm Nike tuyệt vời!</p>
            <Link href="/">
              <button className="shop-button">
                Mua sắm ngay
              </button>
            </Link>
          </div>
        ) : (
          // Orders list
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-helvetica-medium">
                Tổng cộng {orders.length} đơn hàng
              </h2>
              <div className="flex items-center space-x-4">
                <select className="border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="shipping">Đang giao hàng</option>
                  <option value="delivered">Đã giao</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.orderNumber} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">                    {/* Order Image & Info */}
                    <div className="flex items-center space-x-4">
                      <Image
                        src={order.previewImage}
                        alt="Sản phẩm"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-helvetica-medium">#{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">{order.itemCount} sản phẩm</p>
                        <p className="text-sm text-gray-600">{order.orderDate}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Total Amount */}
                    <div className="text-right md:text-left">
                      <p className="font-helvetica-medium text-lg">{formatPrice(order.totalAmount)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 justify-end">
                      <Link href={`/orders/${order.orderNumber}`}>
                        <button className="border border-black text-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-colors text-sm">
                          Xem chi tiết
                        </button>
                      </Link>
                      {order.status === 'Đã giao' && (
                        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors text-sm">
                          Mua lại
                        </button>
                      )}
                      {order.status === 'Đang giao hàng' && (
                        <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors text-sm">
                          Theo dõi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50" disabled>
                  ← Trước
                </button>
                <button className="px-4 py-2 bg-black text-white rounded-full">
                  1
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  2
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  3
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  Sau →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}