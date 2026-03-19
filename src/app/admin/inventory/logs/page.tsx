'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDateTime } from '@/lib/utils/date-utils';
import {
  Search,
  Filter,
  History,
  User,
  Package,
  Warehouse,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface InventoryLog {
  id: number;
  inventoryId: number;
  adminId: number | null;
  adminName: string | null;
  quantityChange: number;
  reason: string;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  sku: string;
  variantName: string;
  size: string | null;
  warehouseName: string;
}

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/inventory/logs?page=${page}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        setHasMore(data.data.length === 20);
      }
    } catch (error) {
      console.error('Error fetching inventory logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, { label: string; color: string }> = {
      restock: { label: 'Nhập hàng', color: 'bg-green-100 text-green-800' },
      init: { label: 'Khởi tạo', color: 'bg-blue-100 text-blue-800' },
      order_reserved: { label: 'Đặt hàng (Giữ chỗ)', color: 'bg-yellow-100 text-yellow-800' },
      order_cancelled: { label: 'Hủy đơn (Hoàn kho)', color: 'bg-purple-100 text-purple-800' },
      order_fulfilled: { label: 'Xuất kho (Giao hàng)', color: 'bg-gray-100 text-gray-800' },
      transfer_in: { label: 'Luân chuyển đến', color: 'bg-teal-100 text-teal-800' },
      transfer_out: { label: 'Luân chuyển đi', color: 'bg-orange-100 text-orange-800' },
      adjustment: { label: 'Điều chỉnh thủ công', color: 'bg-red-100 text-red-800' },
      return: { label: 'Khách trả hàng', color: 'bg-pink-100 text-pink-800' },
    };

    const config = reasons[reason] || { label: reason, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin/inventory" className="hover:text-black">
                Quản lý kho
              </Link>
              <span>/</span>
              <span className="text-black font-medium">Nhật ký biến động</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="w-6 h-6" />
              Nhật ký biến động kho
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Theo dõi chi tiết lịch sử nhập, xuất và điều chuyển hàng hóa
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/inventory"
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại kho
            </Link>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sản phẩm / Kho
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Lý do
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Biến động
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Người thực hiện
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Đang tải nhật ký...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Chưa có dữ liệu biến động nào.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDateTime(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{log.variantName}</span>
                          <span className="text-xs text-gray-500">
                            SKU: {log.sku} | Size: {log.size || '-'}
                          </span>
                          <div className="flex items-center gap-1 mt-1 text-xs font-medium text-blue-600">
                            <Warehouse className="w-3 h-3" />
                            {log.warehouseName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getReasonLabel(log.reason)}
                        {log.referenceId && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            Ref: #{log.referenceId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-bold ${log.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm text-gray-700">{log.adminName || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className="text-xs text-gray-500 max-w-[200px] truncate"
                          title={log.notes || ''}
                        >
                          {log.notes || '-'}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-500">Đang hiển thị trang {page}</p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Trước
              </button>
              <button
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
