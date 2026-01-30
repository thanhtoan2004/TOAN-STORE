'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  starts_at: string;
  ends_at: string;
  usage_limit: number | null;
  times_used: number;
}

interface VoucherHistory {
  id: number;
  code: string;
  description: string;
  discountAmount: number;
  orderId: number | null;
  orderNumber: string | null;
  usedAt: string;
}

export default function VouchersPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'history'>('list');
  const [history, setHistory] = useState<VoucherHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchCoupons();
    if (user && activeTab === 'history') {
      fetchHistory();
    }
  }, [user, activeTab]);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/voucher/list');
      const data = await response.json();
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Đã sao chép mã: ${code}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discount_type === 'percent') {
      return `Giảm ${coupon.discount_value}%`;
    }
    return `Giảm ${coupon.discount_value.toLocaleString('vi-VN')}₫`;
  };

  const getUsageText = (coupon: Coupon) => {
    if (coupon.usage_limit === null) {
      return 'Không giới hạn';
    }
    const remaining = coupon.usage_limit - coupon.times_used;
    return `Còn ${remaining}/${coupon.usage_limit} lượt`;
  };

  const fetchHistory = async () => {
    if (!user) return;

    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/voucher/history?userId=${user.id}`);
      const data = await response.json();
      if (data.success && data.data?.usageHistory) {
        setHistory(data.data.usageHistory);
      }
    } catch (error) {
      console.error('Error fetching voucher history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Đang tải voucher...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="nike-container py-8">
          <h1 className="text-4xl font-nike-futura mb-2">Mã Giảm Giá</h1>
          <p className="text-gray-600 mb-4">Khám phá các ưu đãi đặc biệt dành cho bạn</p>

          {user && (
            <div className="flex gap-4 border-b">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === 'list'
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-600 hover:text-black'
                  }`}
              >
                Danh Sách Voucher
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === 'history'
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-600 hover:text-black'
                  }`}
              >
                Lịch Sử Sử Dụng
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="nike-container py-8">
        {activeTab === 'list' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600 text-lg mb-4">Hiện chưa có voucher nào</p>
                  <Link href="/">
                    <button className="shop-button">Quay lại trang chủ</button>
                  </Link>
                </div>
              ) : (
                coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6">
                      <div className="text-3xl font-bold mb-2">{getDiscountText(coupon)}</div>
                      <div className="text-sm opacity-90">{coupon.description}</div>
                    </div>

                    <div className="p-6">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Mã voucher:</span>
                          <button
                            onClick={() => copyToClipboard(coupon.code)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Sao chép
                          </button>
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-3 text-center">
                          <span className="text-xl font-bold tracking-wider">{coupon.code}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hiệu lực:</span>
                          <span className="font-medium">
                            {formatDate(coupon.starts_at)} - {formatDate(coupon.ends_at)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số lượng:</span>
                          <span className="font-medium">{getUsageText(coupon)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <Link href="/checkout">
                          <button className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition">
                            Sử dụng ngay
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-helvetica-medium mb-4">Hướng dẫn sử dụng voucher</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-black font-bold mr-2">1.</span>
                  <span>Chọn sản phẩm và thêm vào giỏ hàng</span>
                </li>
                <li className="flex items-start">
                  <span className="text-black font-bold mr-2">2.</span>
                  <span>Tiến hành thanh toán tại trang checkout</span>
                </li>
                <li className="flex items-start">
                  <span className="text-black font-bold mr-2">3.</span>
                  <span>Nhập mã voucher vào ô "Mã giảm giá" và nhấn "Áp dụng"</span>
                </li>
                <li className="flex items-start">
                  <span className="text-black font-bold mr-2">4.</span>
                  <span>Hoàn tất đặt hàng và tận hưởng ưu đãi</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-helvetica-medium mb-6">Lịch Sử Sử Dụng Voucher</h2>

            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải lịch sử...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">Bạn chưa sử dụng voucher nào</p>
                <Link href="/vouchers">
                  <button className="shop-button" onClick={() => setActiveTab('list')}>
                    Xem Danh Sách Voucher
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg">{item.code}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Đã sử dụng
                          </span>
                        </div>
                        <p className="text-gray-600">{item.description}</p>
                        {item.orderNumber && (
                          <Link href={`/orders/${item.orderNumber}`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                            Xem đơn hàng {item.orderNumber}
                          </Link>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          -{item.discountAmount.toLocaleString('vi-VN')} ₫
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(item.usedAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
