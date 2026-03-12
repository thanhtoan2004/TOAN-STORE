'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDate, formatCurrency } from '@/lib/utils/date-utils';

interface Voucher {
  id: number;
  code: string;
  value: number;
  discount_type: 'fixed' | 'percent';
  description: string | null;
  recipient_user_id: number | null;
  recipient_email: string | null;
  redeemed_by_user_id: number | null;
  min_order_value: number;
  applicable_tier: string | null;
  status: 'active' | 'inactive' | 'redeemed' | 'expired';
  valid_from: string | null;
  valid_until: string | null;
  redeemed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    value: 0,
    discount_type: 'fixed' as 'fixed' | 'percent',
    description: '',
    recipient_email: '',
    min_order_value: 0,
    valid_until: '',
    applicable_tier: 'bronze',
    status: 'active' as 'active' | 'inactive' | 'redeemed' | 'expired',
  });

  useEffect(() => {
    fetchVouchers();
  }, [page]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/vouchers?page=${page}&limit=20`);
      const data = await response.json();

      if (data.success) {
        setVouchers(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.value) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/vouchers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value.toString()),
          min_order_value: parseFloat(formData.min_order_value.toString()) || 0,
          recipient_email: formData.recipient_email || null,
          valid_until: formData.valid_until || null,
          ...(editingId && { id: editingId }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(editingId ? 'Cập nhật thành công' : 'Tạo thành công');
        resetForm();
        fetchVouchers();
      } else {
        alert(data.message || 'Lỗi khi lưu');
      }
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Lỗi khi lưu');
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setFormData({
      code: voucher.code,
      value: voucher.value,
      discount_type: voucher.discount_type || 'fixed',
      description: voucher.description || '',
      recipient_email: voucher.recipient_email || '',
      min_order_value: voucher.min_order_value || 0,
      valid_until: voucher.valid_until ? voucher.valid_until.split('T')[0] : '',
      applicable_tier: voucher.applicable_tier || 'bronze',
      status: voucher.status,
    });
    setEditingId(voucher.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;

    try {
      const response = await fetch(`/api/admin/vouchers?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Xóa thành công');
        fetchVouchers();
      }
    } catch (error) {
      console.error('Error deleting voucher:', error);
      alert('Lỗi khi xóa');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      value: 0,
      discount_type: 'fixed',
      description: '',
      recipient_email: '',
      min_order_value: 0,
      valid_until: '',
      applicable_tier: 'bronze',
      status: 'active',
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Vouchers Cá nhân</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gán mã ưu đãi cho từng khách hàng cụ thể qua Email
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Thêm Voucher
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-helvetica-medium mb-6">
              {editingId ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã Voucher *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                    placeholder="VD: VIP-USER-2024"
                    disabled={!!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại giảm giá</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'fixed' | 'percent',
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                  >
                    <option value="fixed">Cố định (đ)</option>
                    <option value="percent">Phần trăm (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Giá trị giảm *</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                    placeholder={formData.discount_type === 'percent' ? '10' : '50000'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Người nhận (Target Email)
                  </label>
                  <input
                    type="email"
                    value={formData.recipient_email}
                    onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                    placeholder="customer@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Chỉ người dùng có email này mới thấy và sử dụng được mã.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Giá trị đơn hàng tối thiểu
                  </label>
                  <input
                    type="number"
                    value={formData.min_order_value}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order_value: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hạng thành viên tối thiểu
                  </label>
                  <select
                    value={formData.applicable_tier}
                    onChange={(e) => setFormData({ ...formData, applicable_tier: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                  >
                    <option value="bronze">Bronze (Tất cả)</option>
                    <option value="silver">Silver trở lên</option>
                    <option value="gold">Gold trở lên</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Vô hiệu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mô tả hiển thị cho khách
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                  placeholder="VD: Quà tặng tri ân khách hàng thân thiết"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {editingId ? 'Cập nhật' : 'Tạo Voucher'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mã / Mô tả
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Giá trị / ĐK
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email Người nhận
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hạn dùng / Hạng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Chưa có voucher nào được tạo.
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{voucher.code}</div>
                        <div className="text-xs text-gray-500 max-w-[200px] truncate">
                          {voucher.description || 'Không có mô tả'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-green-600">
                          {voucher.discount_type === 'percent'
                            ? `${voucher.value}%`
                            : formatCurrency(voucher.value)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {formatCurrency(voucher.min_order_value)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {voucher.recipient_email ? (
                          <div className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-0.5 inline-block">
                            {voucher.recipient_email}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Dùng chung (Public)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {voucher.valid_until ? formatDate(voucher.valid_until) : 'Vĩnh viễn'}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                              voucher.applicable_tier === 'platinum'
                                ? 'bg-purple-100 text-purple-700'
                                : voucher.applicable_tier === 'gold'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : voucher.applicable_tier === 'silver'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {voucher.applicable_tier || 'bronze'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            voucher.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : voucher.status === 'redeemed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {voucher.status === 'active'
                            ? 'Sẵn dụng'
                            : voucher.status === 'redeemed'
                              ? 'Đã dùng'
                              : voucher.status === 'expired'
                                ? 'Hết hạn'
                                : 'Vô hiệu'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(voucher)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Sửa"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.138 2.5a2.25 2.25 0 113.182 3.182L13 12.061l-4 1 1-4 6.138-6.561z"
                              ></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(voucher.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Xóa"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-white transition-colors"
              >
                Trước
              </button>
              <span className="text-sm font-medium text-gray-700">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-white transition-colors"
              >
                Tiếp
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
