'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function GiftCardBalancePage() {
  const { user } = useAuth();
  const [cardNumber, setCardNumber] = useState('');
  const [pin, setPin] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Clear form when user logs out
  useEffect(() => {
    if (!user) {
      setCardNumber('');
      setPin('');
      setBalance(null);
      setError('');
    }
  }, [user]);

  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBalance(null);

    try {
      const response = await fetch('/api/giftcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardNumber, pin }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể kiểm tra số dư');
      }

      if (data.data?.balance !== undefined) {
        setBalance(data.data.balance);
        // Load history automatically
        loadHistory();
      } else {
        throw new Error('Không tìm thấy thông tin thẻ quà tặng');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi kiểm tra số dư';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!cardNumber || !pin) return;

    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/giftcard/history?cardNumber=${encodeURIComponent(cardNumber)}&pin=${encodeURIComponent(pin)}`);
      const data = await response.json();

      if (data.success && data.data?.transactions) {
        setHistory(data.data.transactions);
        setShowHistory(true);
      }
    } catch (err) {
      console.error('Lỗi khi tải lịch sử:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Kiểm Tra Số Dư Thẻ Quà Tặng</h1>
          <p className="text-gray-600 mb-8">
            Nhập thông tin thẻ quà tặng của bạn để kiểm tra số dư
          </p>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <form onSubmit={handleCheckBalance} className="space-y-6">
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium mb-2">
                  Số Thẻ Quà Tặng *
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Nhập số thẻ quà tặng"
                  required
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium mb-2">
                  Mã PIN *
                </label>
                <input
                  type="text"
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Nhập mã PIN"
                  required
                  maxLength={4}
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {balance !== null && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-helvetica-medium mb-2">Số Dư Thẻ Quà Tặng</h3>
                  <p className="text-3xl font-bold text-green-800 mb-4">
                    {balance.toLocaleString('vi-VN')} ₫
                  </p>
                  <button
                    onClick={loadHistory}
                    disabled={loadingHistory}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {loadingHistory ? 'Đang tải...' : 'Xem lịch sử giao dịch'}
                  </button>
                </div>
              )}

              {showHistory && history.length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-helvetica-medium mb-4">Lịch Sử Giao Dịch</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.map((transaction) => (
                      <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">
                              {transaction.type === 'purchase' ? 'Mua thẻ' :
                                transaction.type === 'redeem' ? 'Sử dụng thẻ' :
                                  transaction.type === 'refund' ? 'Hoàn tiền' : 'Giao dịch'}
                            </p>
                            <p className="text-sm text-gray-600">{transaction.description || 'Không có mô tả'}</p>
                            {transaction.orderId && (
                              <p className="text-xs text-gray-500">Đơn hàng: #{transaction.orderId}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${transaction.type === 'redeem' ? 'text-red-600' : 'text-green-600'}`}>
                              {transaction.type === 'redeem' ? '-' : '+'}
                              {Math.abs(transaction.amount).toLocaleString('vi-VN')} ₫
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Số dư: {transaction.balanceBefore?.toLocaleString('vi-VN')} ₫ → {transaction.balanceAfter?.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang kiểm tra...' : 'Kiểm Tra Số Dư'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-helvetica-medium mb-4">Thông Tin Thêm</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Thẻ quà tặng có thể sử dụng cho tất cả sản phẩm trên website</li>
                <li>• Thẻ quà tặng không thể đổi lấy tiền mặt</li>
                <li>• Thẻ quà tặng có thời hạn sử dụng 12 tháng kể từ ngày mua</li>
                <li>• Nếu số dư không đủ, bạn có thể thanh toán phần còn lại bằng phương thức khác</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

