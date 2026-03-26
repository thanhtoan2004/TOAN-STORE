'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDateTime } from '@/lib/utils/date-utils';
import { Plus, Edit, Trash2, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

interface FlashSale {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: number;
  created_at: string;
}

export default function FlashSalesAdminPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      const response = await fetch('/api/admin/flash-sales');
      const result = await response.json();
      if (result.success) {
        setFlashSales(result.data);
      }
    } catch (error) {
      console.error('Error fetching flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFlashSale = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đợt Flash Sale này không?')) return;

    try {
      const response = await fetch(`/api/admin/flash-sales/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setFlashSales(flashSales.filter((fs) => fs.id !== id));
      }
    } catch (error) {
      console.error('Error deleting flash sale:', error);
    }
  };

  const toggleStatus = async (id: number, currentStatus: number) => {
    try {
      const response = await fetch(`/api/admin/flash-sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: currentStatus === 1 ? 0 : 1 }),
      });
      if (response.ok) {
        fetchFlashSales();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const getStatus = (fs: FlashSale) => {
    const now = new Date();
    const start = new Date(fs.start_time);
    const end = new Date(fs.end_time);

    if (fs.is_active === 0)
      return {
        label: 'Vô hiệu hóa',
        color: 'bg-gray-100 text-gray-800',
        icon: <XCircle className="w-4 h-4" />,
      };
    if (now < start)
      return {
        label: 'Sắp diễn ra',
        color: 'bg-blue-100 text-blue-800',
        icon: <Clock className="w-4 h-4" />,
      };
    if (now > end)
      return {
        label: 'Đã kết thúc',
        color: 'bg-red-100 text-red-800',
        icon: <CheckCircle className="w-4 h-4" />,
      };
    return {
      label: 'Đang diễn ra',
      color: 'bg-green-100 text-green-800',
      icon: <Plus className="w-4 h-4 animate-pulse" />,
    };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Flash Sales</h1>
            <p className="text-gray-500">Tạo và quản lý các chương trình giảm giá chớp nhoáng</p>
          </div>
          <Link
            href="/admin/flash-sales/new"
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo mới Flash Sale
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên chương trình
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : flashSales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    Chưa có đợt Flash Sale nào
                  </td>
                </tr>
              ) : (
                flashSales.map((fs) => {
                  const status = getStatus(fs);
                  return (
                    <tr key={fs.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{fs.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {fs.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>Bắt đầu: {formatDateTime(fs.start_time)}</div>
                        <div>Kết thúc: {formatDateTime(fs.end_time)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => toggleStatus(fs.id, fs.is_active)}
                            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                              fs.is_active === 1
                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                            title={
                              fs.is_active === 1
                                ? 'Đang hoạt động - Nhấn để tắt'
                                : 'Đang tắt - Nhấn để bật'
                            }
                          >
                            {fs.is_active === 1 ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                          </button>

                          <Link
                            href={`/admin/flash-sales/${fs.id}`}
                            className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                            title="Chỉnh sửa / Xem chi tiết"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>

                          <button
                            onClick={() => deleteFlashSale(fs.id)}
                            className="flex items-center justify-center w-9 h-9 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
