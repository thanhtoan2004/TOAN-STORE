'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils/date-utils';

interface GiftCard {
  id: number;
  card_number: string;
  pin: string;
  initial_balance: number;
  current_balance: number;
  status: string;
  failed_attempts: number;
  expires_at: string;
  created_at: string;
}

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchGiftCards();
  }, [page, search]);

  const fetchGiftCards = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/gift-cards?${params}`);
      const data = await response.json();

      if (data.success) {
        setGiftCards(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching gift cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa gift card này?')) return;

    try {
      const response = await fetch(`/api/admin/gift-cards/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGiftCards();
      }
    } catch (error) {
      console.error('Error deleting gift card:', error);
    }
  };

  const handleUnlock = async (id: number) => {
    if (!confirm('Khôi phục và mở khóa thẻ quà tặng này?')) return;

    try {
      const response = await fetch(`/api/admin/gift-cards/${id}/unlock`, {
        method: 'PATCH',
      });

      if (response.ok) {
        alert('Đã mở khóa thẻ quà tặng!');
        fetchGiftCards();
      } else {
        const data = await response.json();
        alert(data.message || 'Lỗi khi mở khóa');
      }
    } catch (error) {
      console.error('Error unlocking gift card:', error);
      alert('Lỗi khi mở khóa thẻ');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Gift Card</h1>
            <p className="mt-1 text-sm text-gray-500">Quản lý mã gift card và số dư</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium bg-gray-100 px-4 py-2 rounded-full">
              Total Cards: <span className="font-bold">{total}</span>
            </div>
            <Link
              href="/admin/gift-cards/new"
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              + Tạo Gift Card
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Tìm kiếm mã, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-8">Đang tải...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số thẻ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    PIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Giá trị gốc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số dư
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hết hạn
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Lần thử sai
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {giftCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 select-all">
                      {card.card_number}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 select-all">
                      {card.pin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(card.initial_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(card.current_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          card.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : card.status === 'used'
                              ? 'bg-blue-100 text-blue-800'
                              : card.status === 'locked'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {card.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(card.expires_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span
                        className={`font-medium ${card.failed_attempts >= 5 ? 'text-red-600' : 'text-gray-500'}`}
                      >
                        {card.failed_attempts || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-4">
                      {card.status === 'locked' && (
                        <button
                          onClick={() => handleUnlock(card.id)}
                          className="text-orange-600 hover:text-orange-900 font-medium"
                        >
                          Mở khóa
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-4 py-2">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
