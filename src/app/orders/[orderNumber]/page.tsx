'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatCurrency } from '@/lib/date-utils';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { Printer } from 'lucide-react';

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
  orderDateRaw: string; // Added for Timeline
  dates: { // Added for Timeline
    confirmed_at?: string;
    shipped_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
  };
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
  carrier: string | null;
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



import RefundModal from '@/components/refunds/RefundModal';

import { useAuth } from '@/contexts/AuthContext';

export default function OrderDetailPage() {
  const { t } = useLanguage();
  const { user: authUser, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { addMultipleToCart } = useCart();
  const orderNumber = params?.orderNumber as string;
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundStatus, setRefundStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        if (authLoading) return;
        if (!authUser) {
          router.push(`/login?callbackUrl=/orders/${orderNumber}`);
          return;
        }

        setLoading(true);

        let response = await fetch(`/api/orders/${orderNumber}`);

        if (response.status === 401) {
          // Thử refresh token một lần
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
          if (refreshRes.ok) {
            response = await fetch(`/api/orders/${orderNumber}`);
          }
        }

        if (!response.ok) {
          if (response.status === 401) {
            router.push(`/login?callbackUrl=/orders/${orderNumber}`);
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Order not found');
        }

        const data = await response.json();
        const order = data.order;

        // Fetch refund status if delivered
        let refundState = null;
        if (order.status === 'delivered') {
          try {
            const refundRes = await fetch('/api/refunds');
            if (refundRes.ok) {
              const refundData = await refundRes.json();
              const currentRefund = refundData.refunds.find((r: any) => r.order_id === order.id);
              if (currentRefund) {
                refundState = currentRefund.status;
              }
            }
          } catch (e) {
            console.error("Error fetching refund status", e);
          }
        }
        setRefundStatus(refundState);

        // Transform API data to match OrderData interface
        const transformedData: OrderData = {
          orderNumber: order.order_number,
          orderDate: formatDateTime(order.placed_at),
          orderDateRaw: order.placed_at,
          dates: {
            confirmed_at: order.confirmed_at,
            shipped_at: order.shipped_at,
            delivered_at: order.delivered_at,
            cancelled_at: order.cancelled_at
          },
          status: order.status === 'pending' ? 'pending' :
            order.status === 'processing' ? 'confirmed' :
              order.status === 'shipped' ? 'shipping' :
                order.status === 'delivered' ? 'delivered' :
                  order.status === 'cancelled' ? 'cancelled' : order.status,
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
          carrier: order.carrier || null,
          paymentMethod: order.payment_method || 'Thanh toán khi nhận hàng',
          shippingAddress: {
            name: order.delivery_name || '',
            phone: order.delivery_phone || '',
            address: order.delivery_address || '',
            city: order.delivery_city || '',
            district: order.delivery_district || '',
            ward: order.delivery_ward || ''
          },
          items: order.items?.map((item: any) => ({
            id: item.id.toString(),
            product_id: item.product_id, // Ensure we pass it for handleReorder
            name: item.product_name || item.name,
            image: item.image || '/placeholder-product.png',
            unit_price: parseFloat(item.unit_price || 0),
            total_price: parseFloat(item.total_price || 0),
            size: item.size || 'N/A',
            color: item.color || 'N/A',
            quantity: item.quantity
          })) || []
        };

        // Inject original ID for RefundModal
        (transformedData as any).id = order.id;

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
  }, [orderNumber, authUser, authLoading, router]);

  const getTrackingUrl = (carrier: string | null, trackingNumber: string) => {
    if (!trackingNumber || trackingNumber === 'Chưa có') return null;

    const carrierLower = carrier?.toLowerCase() || '';
    if (carrierLower.includes('ghtk')) return `https://khachhang.ghtk.vn/khach-hang/v2/don-hang?id=${trackingNumber}`;
    if (carrierLower.includes('ghn')) return `https://ghn.vn/blogs/trang-thai-don-hang?id=${trackingNumber}`;
    if (carrierLower.includes('viettel')) return `https://viettelpost.com.vn/tra-cuu-hanh-trinh-don-hang?id=${trackingNumber}`;
    if (carrierLower.includes('vnpost') || carrierLower.includes('vietnam post')) return `https://www.vnpost.vn/vi-vn/tra-cuu-gia-cuoc?type=tracking&code=${trackingNumber}`;

    return `https://www.google.com/search?q=tracking+${trackingNumber}`;
  };

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

  const handleReorder = async () => {
    if (!orderData || orderData.items.length === 0) return;

    try {
      setReordering(true);

      const itemsToReorder = orderData.items.map(item => ({
        productId: (item as any).product_id || parseInt(item.id), // Fallback if detail API didn't have product_id yet (pushed earlier)
        quantity: item.quantity,
        size: item.size
      }));

      const success = await addMultipleToCart(itemsToReorder);
      if (success) {
        router.push('/cart');
      } else {
        alert('Không thể đặt lại đơn hàng. Có thể sản phẩm đã hết hàng hoặc không còn kinh doanh.');
      }
    } catch (error) {
      console.error('Lỗi khi Reorder:', error);
      alert('Có lỗi xảy ra khi đặt lại đơn hàng');
    } finally {
      setReordering(false);
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
            <Button className="rounded-full">
              Xem tất cả đơn hàng
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden">
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
                  {t.orders[orderData.status as keyof typeof t.orders] || orderData.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="nike-container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-helvetica-medium mb-6">Theo dõi đơn hàng</h2>
                <OrderTimeline
                  status={orderData.status}
                  dates={{
                    placed_at: orderData.orderDateRaw, // We need raw date for timeline formatting
                    confirmed_at: orderData.dates?.confirmed_at,
                    shipped_at: orderData.dates?.shipped_at,
                    delivered_at: orderData.dates?.delivered_at,
                    cancelled_at: orderData.dates?.cancelled_at
                  }}
                />
                {orderData.trackingNumber && orderData.trackingNumber !== 'Chưa có' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Mã vận đơn: {orderData.trackingNumber}</p>
                      {orderData.carrier && <p className="text-xs text-blue-600">Đơn vị vận chuyển: {orderData.carrier}</p>}
                    </div>
                    <a
                      href={getTrackingUrl(orderData.carrier, orderData.trackingNumber) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition"
                    >
                      Theo dõi tại web vận chuyển
                    </a>
                  </div>
                )}
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
                          <p>Đơn giá: {formatCurrency(item.unit_price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-helvetica-medium text-lg">{formatCurrency(item.total_price)}</p>
                        <p className="text-sm text-gray-600">({item.quantity} × {formatCurrency(item.unit_price)})</p>
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
                    <span>{formatCurrency(orderData.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span>{formatCurrency(orderData.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thuế VAT:</span>
                    <span>{formatCurrency(orderData.tax)}</span>
                  </div>
                  {orderData.voucherDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá Voucher ({orderData.voucherCode}):</span>
                      <span>-{formatCurrency(orderData.voucherDiscount)}</span>
                    </div>
                  )}
                  {orderData.giftcardDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Thẻ quà tặng (****{orderData.giftcardNumber?.slice(-4)}):</span>
                      <span>-{formatCurrency(orderData.giftcardDiscount)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between font-helvetica-medium text-lg">
                    <span>Tổng cộng:</span>
                    <span>{formatCurrency(orderData.finalTotal)}</span>
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
                    <Button variant="outline" className="w-full rounded-full border-black text-black hover:bg-black hover:text-white">
                      Theo dõi đơn hàng
                    </Button>
                  </Link>
                  <Link href="/help/contact">
                    <Button variant="outline" className="w-full rounded-full border-gray-300 text-gray-700 hover:bg-gray-50">
                      Liên hệ hỗ trợ
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="w-full rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    In hóa đơn
                  </Button>
                  {orderData.status === 'pending' && (
                    <Button
                      variant="outline"
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                      className="w-full rounded-full border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-helvetica-medium mb-4">Mua lại</h2>
                <Button
                  className="w-full rounded-full mb-3"
                  onClick={handleReorder}
                  disabled={reordering}
                >
                  {reordering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </div>
                  ) : 'Đặt lại đơn hàng này'}
                </Button>

                {/* Refund Button Logic */}
                {orderData.status === 'delivered' && (
                  <>
                    {refundStatus ? (
                      <div className={`text-center p-3 rounded-lg border ${refundStatus === 'approved' ? 'bg-green-50 border-green-200 text-green-700' :
                        refundStatus === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                          'bg-yellow-50 border-yellow-200 text-yellow-700'
                        }`}>
                        <p className="font-medium">Trạng thái hoàn tiền:
                          {refundStatus === 'pending' ? ' Đang chờ xử lý' :
                            refundStatus === 'approved' ? ' Đã chấp nhận' :
                              refundStatus === 'rejected' ? ' Đã từ chối' : refundStatus}
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-gray-3000 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowRefundModal(true)}
                      >
                        Yêu cầu hoàn tiền / Trả hàng
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {orderData && (
          <RefundModal
            isOpen={showRefundModal}
            onClose={() => setShowRefundModal(false)}
            orderId={(orderData as any).id}
            orderNumber={orderData.orderNumber}
            items={orderData.items}
            onSuccess={() => {
              setRefundStatus('pending');
              // Could re-fetch data here if needed
            }}
          />
        )}
      </div>

      {/* Invoice Print Layout (Hidden on screen, visible on print) */}
      {orderData && (
        <div className="hidden print:block bg-white p-0 print-layout-root">
          <InvoiceSection orderData={orderData} copyLabel="LIÊN 1: CỬA HÀNG" />
          <div className="page-break"></div>
          <InvoiceSection orderData={orderData} copyLabel="LIÊN 2: KHÁCH HÀNG" />
        </div>
      )}

      <style jsx global>{`
        @media print {
          /* Hide EVERYTHING else in the app layout */
          header, footer, nav, aside, .no-print {
            display: none !important;
          }
          
          @page {
            size: A4;
            margin: 0mm; /* Let the component handle internal padding */
          }
          
          body {
            background-color: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
          }
          
          .print-layout-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            z-index: 9999;
          }

          .page-break {
            display: block;
            page-break-after: always;
            height: 0;
            overflow: hidden;
            border: none;
          }
        }
      `}</style>
    </div>
  );
}

// Separated component for Invoice UI to avoid duplication in code
function InvoiceSection({ orderData, copyLabel }: { orderData: OrderData; copyLabel: string }) {
  return (
    <div className="py-4 px-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold nike-heading">NIKE CLONE STORE</h1>
          <p className="text-xs text-gray-600">Website: nike-clone.demo | Hotline: 1800-1234</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold uppercase">{copyLabel}</h2>
          <p className="text-xs font-medium text-gray-700">Số: #{orderData.orderNumber}</p>
          <p className="text-xs text-gray-600">Ngày: {orderData.orderDate}</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
        <h3 className="font-bold border-b pb-1 mb-2 uppercase text-[10px] text-gray-500 tracking-wider">Thông tin khách hàng</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p><span className="font-semibold">Người nhận:</span> {orderData.shippingAddress.name}</p>
            <p><span className="font-semibold">Điện thoại:</span> {orderData.shippingAddress.phone}</p>
          </div>
          <div>
            <p><span className="font-semibold">Địa chỉ:</span> {orderData.shippingAddress.address}</p>
            <p><span className="font-semibold text-gray-500">Khu vực:</span> {orderData.shippingAddress.ward}, {orderData.shippingAddress.district}, {orderData.shippingAddress.city}</p>
          </div>
        </div>
      </div>

      <table className="w-full mb-4 text-xs border-collapse">
        <thead className="bg-gray-100 italic">
          <tr>
            <th className="py-1.5 px-3 text-left border">Sản phẩm</th>
            <th className="py-1.5 px-3 text-center border">Size/Màu</th>
            <th className="py-1.5 px-3 text-center border w-10">SL</th>
            <th className="py-1.5 px-3 text-right border">Đơn giá</th>
            <th className="py-1.5 px-3 text-right border">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {orderData.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1.5 px-3 border">{item.name}</td>
              <td className="py-1.5 px-3 border text-center">{item.size} / {item.color}</td>
              <td className="py-1.5 px-3 border text-center">{item.quantity}</td>
              <td className="py-1.5 px-3 border text-right">{formatCurrency(item.unit_price)}</td>
              <td className="py-1.5 px-3 border text-right font-medium">{formatCurrency(item.total_price)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="font-bold">
          <tr>
            <td colSpan={4} className="py-1 px-3 text-right border">Tạm tính:</td>
            <td className="py-1 px-3 text-right border">{formatCurrency(orderData.totalAmount)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="py-1 px-3 text-right border">Phí vận chuyển:</td>
            <td className="py-1 px-3 text-right border">{formatCurrency(orderData.shippingFee)}</td>
          </tr>
          {orderData.tax > 0 && (
            <tr>
              <td colSpan={4} className="py-1 px-3 text-right border">Thuế VAT:</td>
              <td className="py-1 px-3 text-right border">{formatCurrency(orderData.tax)}</td>
            </tr>
          )}
          {orderData.voucherDiscount > 0 && (
            <tr>
              <td colSpan={4} className="py-1 px-3 text-right border text-green-600">
                Giảm giá Voucher ({orderData.voucherCode || 'VOUCHER'}):
              </td>
              <td className="py-1 px-3 text-right border text-green-600">-{formatCurrency(orderData.voucherDiscount)}</td>
            </tr>
          )}
          {orderData.giftcardDiscount > 0 && (
            <tr>
              <td colSpan={4} className="py-1 px-3 text-right border text-green-600">
                Thẻ quà tặng ({orderData.giftcardNumber ? `****${orderData.giftcardNumber.slice(-4)}` : 'GIFT CARD'}):
              </td>
              <td className="py-1 px-3 text-right border text-green-600">-{formatCurrency(orderData.giftcardDiscount)}</td>
            </tr>
          )}
          {/* Discount general (if any membership discount remains after subtracting voucher/giftcard) */}
          {(orderData.discount - orderData.voucherDiscount - orderData.giftcardDiscount > 1) && (
            <tr>
              <td colSpan={4} className="py-1 px-3 text-right border text-green-600">Ưu đãi thành viên:</td>
              <td className="py-1 px-3 text-right border text-green-600">-{formatCurrency(orderData.discount - orderData.voucherDiscount - orderData.giftcardDiscount)}</td>
            </tr>
          )}
          <tr className="text-base bg-gray-50">
            <td colSpan={4} className="py-2 px-3 text-right border">TỔNG CỘNG:</td>
            <td className="py-2 px-3 text-right border">{formatCurrency(orderData.finalTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="grid grid-cols-2 gap-8 text-center mt-6">
        <div>
          <p className="font-bold text-sm">Người mua hàng</p>
          <p className="text-[10px] italic text-gray-400">(Ký và ghi rõ họ tên)</p>
          <div className="h-12"></div>
        </div>
        <div>
          <p className="font-bold text-sm">Người bán hàng</p>
          <p className="text-[10px] italic text-gray-400">(Ký và ghi rõ họ tên)</p>
          <div className="h-12 flex items-center justify-center relative">
            <div className="absolute border-2 border-red-500 text-red-500 font-bold px-3 py-0.5 rotate-12 opacity-60 uppercase text-[10px]">Đã thanh toán</div>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-400 mt-4">Cảm ơn quý khách đã mua sắm tại Nike Clone!</p>
    </div>
  );
}



