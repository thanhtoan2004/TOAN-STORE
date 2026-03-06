'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Ticket, Clock, CheckCircle, AlertCircle, Copy, ChevronLeft } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/date-utils';
import Link from 'next/link';

interface UserVoucher {
  code: string;
  value: number;
  discount_type: 'fixed' | 'percent';
  description: string | null;
  valid_until: string | null;
  status: 'active' | 'inactive' | 'redeemed' | 'expired';
}

export default function UserVouchersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    if (isAuthenticated) {
      fetchVouchers();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/vouchers');
      const data = await response.json();
      if (data.success) {
        setVouchers(data.data);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(code);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 flex items-center gap-4">
          <Link
            href="/account/settings"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-helvetica-bold text-gray-900">Ưu đãi của tôi</h1>
              <p className="text-sm text-gray-500">Mã giảm giá dành riêng cho bạn</p>
            </div>
            <Link
              href="/account/redeem"
              className="hidden sm:inline-flex px-5 py-2.5 bg-black text-white text-sm font-helvetica-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm"
            >
              Đổi điểm nhận Voucher
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mb-4"></div>
              <div className="h-4 w-48 bg-gray-100 rounded mb-2"></div>
              <div className="h-3 w-32 bg-gray-50 rounded"></div>
            </div>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm px-6">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-helvetica-medium text-gray-900 mb-2">
              Bạn chưa có voucher nào
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Mã giảm giá cá nhân sẽ xuất hiện ở đây sau khi bạn nhận được từ các chương trình ưu
              đãi hoặc quà tặng.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-block px-10 py-4 bg-black text-white rounded-full font-helvetica-medium hover:bg-gray-800 transition-colors shadow-md"
              >
                Khám phá sản phẩm
              </Link>
              <Link
                href="/account/redeem"
                className="inline-block px-10 py-4 bg-white text-black border-2 border-black rounded-full font-helvetica-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                Đổi điểm thưởng
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {vouchers.map((voucher, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Decorative punched holes style */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full -translate-y-1/2 border-r border-gray-100 z-10"></div>
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full -translate-y-1/2 border-l border-gray-100 z-10"></div>

                <div className="flex flex-col md:flex-row">
                  {/* Left Side (Value) */}
                  <div className="bg-black text-white p-8 md:w-56 flex flex-col items-center justify-center text-center">
                    <div className="text-sm font-helvetica-medium opacity-70 mb-1 uppercase tracking-widest text-white/80">
                      GIẢM
                    </div>
                    <div className="text-4xl font-helvetica-bold">
                      {voucher.discount_type === 'percent'
                        ? `${voucher.value}%`
                        : formatCurrency(voucher.value)}
                    </div>
                  </div>

                  {/* Right Side (Content) */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-helvetica-bold text-gray-900">
                          {voucher.description || 'Quà tặng dành cho bạn'}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            voucher.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {voucher.status === 'active' ? 'Sẵn sàng dùng' : 'Vô hiệu'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Sử dụng mã này tại trang thanh toán để nhận ngay ưu đãi khi mua sắm tại TOAN
                        Store.
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-auto">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            Hạn dùng:{' '}
                            {voucher.valid_until
                              ? formatDate(voucher.valid_until)
                              : 'Không giới hạn'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs">Chỉ áp dụng cho tài khoản của bạn</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div
                          className={`flex items-center gap-3 px-4 py-2 border-2 ${
                            copySuccess === voucher.code
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          } rounded-xl group-hover:border-black transition-all cursor-pointer`}
                          onClick={() => handleCopy(voucher.code)}
                        >
                          <span className="font-mono font-bold text-lg tracking-wider text-gray-800">
                            {voucher.code}
                          </span>
                          <Copy
                            className={`w-5 h-5 ${copySuccess === voucher.code ? 'text-green-600' : 'text-gray-400'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {copySuccess === voucher.code && (
                  <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs py-1 text-center font-helvetica-medium animate-in slide-in-from-bottom duration-300">
                    Đã sao chép mã thành công!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 p-8 bg-blue-50/50 rounded-3xl border border-blue-100/50 text-center">
          <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-4" />
          <h4 className="font-helvetica-bold text-blue-900 mb-1">Cần hỗ trợ?</h4>
          <p className="text-blue-700 text-sm mb-4">
            Nếu bạn gặp khó khăn khi sử dụng mã, vui lòng liên hệ bộ phận hỗ trợ khách hàng của
            chúng tôi.
          </p>
          <Link
            href="/help"
            className="text-blue-600 font-helvetica-medium border-b border-blue-600 pb-0.5 hover:text-blue-800 transition-colors"
          >
            Xem Trung tâm trợ giúp
          </Link>
        </div>
      </div>
    </div>
  );
}
