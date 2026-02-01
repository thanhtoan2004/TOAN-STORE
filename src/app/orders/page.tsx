'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface Order {
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  previewImage: string;
}

export default function OrdersPage() {
  const { t } = useLanguage();
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
          setError(t.common.error); // Or a specific login error
          setLoading(false);
          return;
        }

        const userData = await userResponse.json();
        const response = await fetch(`/api/orders?userId=${userData.user.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();

        // Transform API data to match Order interface
        const transformedOrders = data.orders?.map((order: any) => ({
          orderNumber: order.order_number,
          orderDate: new Date(order.placed_at).toLocaleDateString('vi-VN'),
          status: order.status === 'pending' ? 'pending' :
            order.status === 'processing' ? 'confirmed' :
              order.status === 'shipped' ? 'shipping' :
                order.status === 'delivered' ? 'delivered' :
                  order.status === 'cancelled' ? 'cancelled' : order.status,
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipping':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
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
          <p className="text-gray-600">{t.common.loading}</p>
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
            {t.common.login}
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
              <h1 className="text-3xl font-bold mb-2">{t.orders.title}</h1>
              <p className="text-gray-600">{t.orders.subtitle}</p>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← {t.orders.back_home}
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
            <h2 className="text-2xl font-helvetica-medium mb-4">{t.orders.empty}</h2>
            <p className="text-gray-600 mb-8">{t.orders.empty_desc}</p>
            <Link href="/">
              <button className="shop-button">
                {t.orders.shop_now}
              </button>
            </Link>
          </div>
        ) : (
          // Orders list
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-helvetica-medium">
                {t.orders.total_orders.replace('{count}', orders.length.toString())}
              </h2>
              <div className="flex items-center space-x-4">
                <select className="border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">{t.orders.status_filter}</option>
                  <option value="pending">{t.orders.pending}</option>
                  <option value="confirmed">{t.orders.confirmed}</option>
                  <option value="shipping">{t.orders.shipping}</option>
                  <option value="delivered">{t.orders.delivered}</option>
                  <option value="cancelled">{t.orders.cancelled}</option>
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
                        alt={t.common.product || 'Product'}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-helvetica-medium">#{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">{order.itemCount} {t.orders.items}</p>
                        <p className="text-sm text-gray-600">{order.orderDate}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {t.orders[order.status as keyof typeof t.orders] || order.status}
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
                          {t.orders.view_detail}
                        </button>
                      </Link>
                      {order.status === 'delivered' && (
                        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors text-sm">
                          {t.orders.buy_again}
                        </button>
                      )}
                      {order.status === 'shipping' && (
                        <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors text-sm">
                          {t.orders.track_order}
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
                  ← {t.common.prev || 'Trước'}
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
                  {t.common.next || 'Sau'} →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}