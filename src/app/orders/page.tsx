'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/Button";
import { Package } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/date-utils';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5; // Show 5 orders per page

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user info from API to ensure it's always up-to-date
        const authRes = await fetch('/api/auth/user');
        if (!authRes.ok) {
          setError(t.common.error); // Or a specific login error
          setLoading(false);
          return;
        }

        const userData = await authRes.json();
        const ordersRes = await fetch(`/api/orders?userId=${userData.user.id}&page=${page}&limit=${limit}`);

        if (!ordersRes.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await ordersRes.json();

        // Transform API data to match Order interface
        const transformedOrders = data.orders?.map((order: any) => ({
          orderNumber: order.order_number,
          orderDate: formatDateTime(order.placed_at),
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
        setTotalPages(data.pagination?.totalPages || 1);
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải danh sách đơn hàng:', error);
        setError('Có lỗi xảy ra khi tải danh sách đơn hàng');
        setOrders([]);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, t.common.error]); // Re-fetch when page changes

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
      case 'pending_payment_confirmation':
        return 'bg-orange-100 text-orange-800';
      case 'payment_received':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const { addToCart, addMultipleToCart } = useCart();
  const [reordering, setReordering] = useState<string | null>(null);

  const handleReorder = async (orderNumber: string) => {
    try {
      setReordering(orderNumber);

      // 1. Lấy chi tiết đơn hàng để có danh sách items (bao gồm size)
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (!res.ok) throw new Error('Không thể lấy chi tiết đơn hàng');

      const data = await res.json();
      const orderItems = data.order?.items;

      if (!orderItems || orderItems.length === 0) {
        alert('Không tìm thấy sản phẩm trong đơn hàng này');
        return;
      }

      // 2. Chuyển đổi sang định dạng API bulk add yêu cầu
      const itemsToReorder = orderItems.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        size: item.size
      }));

      // 3. Gọi hàm bulk add
      const success = await addMultipleToCart(itemsToReorder);

      if (success) {
        // Chuyển hướng đến giỏ hàng để người dùng kiểm tra
        router.push('/cart');
      } else {
        alert('Không thể đặt lại đơn hàng. Có thể sản phẩm đã hết hàng hoặc không còn kinh doanh.');
      }
    } catch (error) {
      console.error('Lỗi khi Reorder:', error);
      alert('Có lỗi xảy ra khi đặt lại đơn hàng');
    } finally {
      setReordering(null);
    }
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
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-helvetica-medium mb-4">{t.orders.empty}</h2>
            <p className="text-gray-600 mb-8">{t.orders.empty_desc}</p>
            <Link href="/">
              <Button className="rounded-full px-6 py-6">
                {t.orders.shop_now}
              </Button>
            </Link>
          </div>
        ) : (
          // Orders list
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-helvetica-medium">
                {t.orders.total_orders.replace('{count}', orders.length.toString())} (Page {page}/{totalPages})
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    {/* Order Image & Info */}
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
                      <p className="font-helvetica-medium text-lg">{formatCurrency(order.totalAmount)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 justify-end">
                      <Link href={`/orders/${order.orderNumber}`}>
                        <Button variant="outline" size="sm" className="rounded-full border-black text-black hover:bg-black hover:text-white">
                          {t.orders.view_detail}
                        </Button>
                      </Link>
                      {order.status === 'delivered' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reordering === order.orderNumber}
                          onClick={() => handleReorder(order.orderNumber)}
                          className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {reordering === order.orderNumber ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              <span>Đang xử lý...</span>
                            </div>
                          ) : t.orders.buy_again}
                        </Button>
                      )}
                      {order.status === 'shipping' && (
                        <Button variant="outline" size="sm" className="rounded-full border-blue-500 text-blue-500 hover:bg-blue-50">
                          {t.orders.track_order}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handlePageChange(page - 1)}
                    variant="outline"
                    className="rounded-full"
                    disabled={page === 1}
                  >
                    ← {t.common.prev || 'Trước'}
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      variant={page === p ? "default" : "outline"}
                      className={`rounded-full ${page !== p ? 'border-gray-300' : ''}`}
                    >
                      {p}
                    </Button>
                  ))}

                  <Button
                    onClick={() => handlePageChange(page + 1)}
                    variant="outline"
                    className="rounded-full"
                    disabled={page === totalPages}
                  >
                    {t.common.next || 'Sau'} →
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}