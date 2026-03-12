'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateTime, formatCurrency } from '@/lib/utils/date-utils';
import {
  CreditCard,
  RefreshCw,
  Star,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface Transaction {
  id: number;
  order_number: string | null;
  amount: number;
  payment_method: string | null;
  transaction_type: 'payment' | 'refund' | 'points' | 'gift_card';
  transaction_status: string;
  created_at: string;
  description?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_TABS = [
  { key: '', label_vi: 'Tất cả', label_en: 'All', icon: Filter },
  { key: 'payment', label_vi: 'Thanh toán', label_en: 'Payments', icon: CreditCard },
  { key: 'refund', label_vi: 'Hoàn tiền', label_en: 'Refunds', icon: RefreshCw },
  { key: 'points', label_vi: 'Điểm thưởng', label_en: 'Points', icon: Star },
  { key: 'gift_card', label_vi: 'Gift Card', label_en: 'Gift Cards', icon: Gift },
];

function TransactionsPageContent() {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState('');

  const searchParams = useSearchParams();

  useEffect(() => {
    const typeFromUrl = searchParams?.get('type');
    if (typeFromUrl && TYPE_TABS.some((tab) => tab.key === typeFromUrl)) {
      setActiveType(typeFromUrl);
    }
  }, [searchParams]);

  const fetchTransactions = useCallback(
    async (page: number = 1, type: string = '') => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ page: page.toString(), limit: '10' });
        if (type) params.set('type', type);

        const res = await fetch(`/api/transactions?${params}`);
        if (!res.ok) {
          if (res.status === 401) {
            setError(
              isVi
                ? 'Vui lòng đăng nhập để xem lịch sử giao dịch'
                : 'Please log in to view transaction history'
            );
            return;
          }
          throw new Error('Failed to fetch');
        }

        const data = await res.json();
        setTransactions(data.transactions || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      } catch (err) {
        setError(isVi ? 'Không thể tải lịch sử giao dịch' : 'Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    },
    [isVi]
  );

  useEffect(() => {
    fetchTransactions(1, activeType);
  }, [activeType, fetchTransactions]);

  const handleTabChange = (type: string) => {
    setActiveType(type);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage, activeType);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/transactions/export');
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(isVi ? 'Không thể xuất file CSV' : 'Failed to export CSV');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4" />;
      case 'points':
        return <Star className="w-4 h-4" />;
      case 'gift_card':
        return <Gift className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { vi: string; en: string }> = {
      payment: { vi: 'Thanh toán', en: 'Payment' },
      refund: { vi: 'Hoàn tiền', en: 'Refund' },
      points: { vi: 'Điểm thưởng', en: 'Points' },
      gift_card: { vi: 'Gift Card', en: 'Gift Card' },
    };
    return isVi ? labels[type]?.vi || type : labels[type]?.en || type;
  };

  const getStatusBadge = (type: string, status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      earn: 'bg-blue-100 text-blue-700',
      spend: 'bg-orange-100 text-orange-700',
      purchase: 'bg-purple-100 text-purple-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getAmountDisplay = (tx: Transaction) => {
    if (tx.transaction_type === 'points') {
      const isEarn = tx.transaction_status === 'earn';
      return (
        <span
          className={`flex items-center gap-1 font-bold ${isEarn ? 'text-green-600' : 'text-red-500'}`}
        >
          {isEarn ? (
            <ArrowDownLeft className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpRight className="w-3.5 h-3.5" />
          )}
          {isEarn ? '+' : '-'}
          {Math.abs(tx.amount)} pts
        </span>
      );
    }

    const isIncoming = tx.transaction_type === 'refund';
    return (
      <span
        className={`flex items-center gap-1 font-bold ${isIncoming ? 'text-green-600' : 'text-gray-900'}`}
      >
        {isIncoming ? (
          <ArrowDownLeft className="w-3.5 h-3.5" />
        ) : (
          <ArrowUpRight className="w-3.5 h-3.5" />
        )}
        {isIncoming ? '+' : '-'}
        {formatCurrency(Math.abs(tx.amount))}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return '';
    const labels: Record<string, string> = {
      cod: 'COD',
      vnpay: 'VNPay',
      momo: 'MoMo',
      zalopay: 'ZaloPay',
      stripe: 'Thẻ tín dụng',
      bank_transfer: 'Chuyển khoản',
      paypal: 'PayPal',
    };
    return labels[method] || method;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="toan-container py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {isVi ? 'Lịch sử giao dịch' : 'Transaction History'}
              </h1>
              <p className="text-gray-500 text-sm">
                {isVi
                  ? 'Xem tất cả giao dịch thanh toán, hoàn tiền, điểm thưởng và gift card'
                  : 'View all payments, refunds, points and gift card transactions'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowDownLeft className="w-4 h-4" />
                {isVi ? 'Xuất CSV' : 'Export CSV'}
              </button>
              <Link
                href="/orders"
                className="text-sm text-gray-500 hover:text-black transition-colors"
              >
                ← {isVi ? 'Đơn hàng' : 'Orders'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="toan-container py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {isVi ? tab.label_vi : tab.label_en}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-48 bg-gray-200 rounded" />
                  </div>
                  <div className="h-5 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/sign-in" className="text-sm underline text-black hover:no-underline">
              {isVi ? 'Đăng nhập' : 'Sign In'}
            </Link>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {isVi ? 'Chưa có giao dịch' : 'No transactions yet'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {isVi
                ? 'Lịch sử giao dịch sẽ hiển thị ở đây'
                : 'Your transaction history will appear here'}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-all"
            >
              {isVi ? 'Mua sắm ngay' : 'Shop Now'}
            </Link>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="text-sm text-gray-500 mb-4">
              {isVi
                ? `Hiển thị ${transactions.length} / ${pagination.total} giao dịch`
                : `Showing ${transactions.length} of ${pagination.total} transactions`}
            </div>

            {/* Transaction List */}
            <div className="space-y-2">
              {transactions.map((tx, index) => (
                <div
                  key={`${tx.transaction_type}-${tx.id}-${index}`}
                  className="bg-white rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow border border-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.transaction_type === 'refund'
                          ? 'bg-green-100 text-green-600'
                          : tx.transaction_type === 'points'
                            ? 'bg-blue-100 text-blue-600'
                            : tx.transaction_type === 'gift_card'
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getTypeIcon(tx.transaction_type)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-gray-900">
                          {getTypeLabel(tx.transaction_type)}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusBadge(tx.transaction_type, tx.transaction_status)}`}
                        >
                          {tx.transaction_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatDateTime(tx.created_at)}</span>
                        {tx.order_number && (
                          <>
                            <span>•</span>
                            <Link
                              href={`/orders/${tx.order_number}`}
                              className="hover:text-black underline"
                            >
                              #{tx.order_number}
                            </Link>
                          </>
                        )}
                        {tx.payment_method && (
                          <>
                            <span>•</span>
                            <span>{getPaymentMethodLabel(tx.payment_method)}</span>
                          </>
                        )}
                      </div>
                      {tx.description && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{tx.description}</p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="flex-shrink-0 text-right">{getAmountDisplay(tx)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 border border-gray-200 rounded-full hover:border-gray-400 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 border border-gray-200 rounded-full hover:border-gray-400 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      }
    >
      <TransactionsPageContent />
    </Suspense>
  );
}
