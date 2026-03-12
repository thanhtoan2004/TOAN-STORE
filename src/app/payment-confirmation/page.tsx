'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/date-utils';

export default function PaymentConfirmationPage() {
  const [formData, setFormData] = useState({
    orderNumber: '',
    amount: '',
    phoneNumber: '',
    transactionNote: '',
    paymentProof: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, paymentProof: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.orderNumber.trim()) {
      setError('Vui lòng nhập mã đơn hàng');
      setLoading(false);
      return;
    }

    if (!formData.amount.trim()) {
      setError('Vui lòng nhập số tiền đã chuyển');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount.replace(/[^\d]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      setError('Số tiền không hợp lệ');
      setLoading(false);
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại đã dùng để chuyển khoản');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('orderNumber', formData.orderNumber.trim());
      formDataToSend.append('amount', amount.toString());
      formDataToSend.append('phoneNumber', formData.phoneNumber.trim());
      formDataToSend.append('transactionNote', formData.transactionNote.trim());
      if (formData.paymentProof) {
        formDataToSend.append('paymentProof', formData.paymentProof);
      }

      const response = await fetch('/api/payment/confirm', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
        setFormData({
          orderNumber: '',
          amount: '',
          phoneNumber: '',
          transactionNote: '',
          paymentProof: null,
        });
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        setError(result.message || 'Không thể xác nhận thanh toán');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="toan-container py-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/help" className="text-gray-600 hover:text-black mb-4 inline-block">
            ← Quay lại Trung Tâm Trợ Giúp
          </Link>

          <h1 className="text-4xl font-bold mb-6">Xác Nhận Thanh Toán</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-helvetica-medium mb-2">Xác Nhận Thành Công!</h2>
                <p className="text-gray-600 mb-6">
                  Chúng tôi đã nhận được thông tin xác nhận thanh toán của bạn. Đơn hàng sẽ được xử
                  lý trong vòng 1-2 giờ làm việc.
                </p>
                <Link
                  href="/orders"
                  className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Xem Đơn Hàng Của Tôi
                </Link>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-helvetica-medium mb-2">Thông Tin Thanh Toán MoMo</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Số điện thoại nhận tiền:</strong> 0879321697
                    </p>
                    <p>
                      <strong>Nội dung chuyển khoản:</strong> Mã đơn hàng của bạn (ví dụ:
                      NK2024123456)
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mã Đơn Hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleInputChange}
                      placeholder="VD: NK2024123456"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Số Tiền Đã Chuyển <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="amount"
                      value={formData.amount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        if (value) {
                          const formatted = formatCurrency(parseInt(value))
                            .replace(' ₫', '')
                            .trim();
                          setFormData((prev) => ({ ...prev, amount: formatted }));
                        } else {
                          setFormData((prev) => ({ ...prev, amount: '' }));
                        }
                      }}
                      placeholder="VD: 1,500,000"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Số Điện Thoại Đã Dùng Để Chuyển Khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="VD: 0901234567"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ghi Chú Giao Dịch (Tùy chọn)
                    </label>
                    <textarea
                      name="transactionNote"
                      value={formData.transactionNote}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Thêm thông tin bổ sung về giao dịch..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ảnh Chứng Từ Thanh Toán (Tùy chọn)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    {formData.paymentProof && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Đã chọn: {formData.paymentProof.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {loading ? 'Đang xử lý...' : 'Xác Nhận Thanh Toán'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
