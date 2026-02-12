'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDate, formatCurrency } from '@/lib/date-utils';

interface Voucher {
  id: number;
  code: string;
  value: number;
  discount_type: string;
  description: string | null;
  recipient_user_id: number | null;
  redeemed_by_user_id: number | null;
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
    description: '',
    recipient_user_id: '',
    valid_until: '',
    status: 'active' as 'active' | 'inactive' | 'redeemed' | 'expired'
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
          recipient_user_id: formData.recipient_user_id ? parseInt(formData.recipient_user_id) : null,
          valid_until: formData.valid_until || null,
          ...(editingId && { id: editingId })
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(editingId ? 'Cập nhật thành công' : 'Tạo thành công');
        setFormData({
          code: '',
          value: 0,
          description: '',
          recipient_user_id: '',
          valid_until: '',
          status: 'active'
        });
        setEditingId(null);
        setShowForm(false);
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
      description: voucher.description || '',
      recipient_user_id: voucher.recipient_user_id?.toString() || '',
      valid_until: voucher.valid_until ? voucher.valid_until.split('T')[0] : '',
      status: voucher.status
    });
    setEditingId(voucher.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;

    try {
      const response = await fetch(`/api/admin/vouchers?id=${id}`, {
        method: 'DELETE'
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

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      code: '',
      value: 0,
      description: '',
      recipient_user_id: '',
      valid_until: '',
      status: 'active'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Vouchers</h1>
            <p className="mt-1 text-sm text-gray-500">Quản lý mã voucher quà tặng và referral</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Thêm Voucher
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Chỉnh sửa Voucher' : 'Thêm Voucher mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mã Voucher *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="VD: GIFT2024"
                    disabled={!!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'redeemed' | 'expired' })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Vô hiệu</option>
                    <option value="redeemed">Đã dùng</option>
                    <option value="expired">Hết hạn</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Giá trị credits *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="VD: 100000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ID Người nhận (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.recipient_user_id}
                    onChange={(e) =>
                      setFormData({ ...formData, recipient_user_id: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Để trống = public voucher"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mô tả
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Mục đích sử dụng voucher"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hết hiệu lực
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Cập nhật' : 'Tạo'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8">Đang tải...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center p-8 text-gray-500">Chưa có vouchers nào</div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mã
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Giá trị Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Người nhận
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hạn dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{voucher.code}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {formatCurrency(voucher.value)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {voucher.recipient_user_id ? `User #${voucher.recipient_user_id}` : 'Public'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {voucher.valid_until ? formatDate(voucher.valid_until) : 'Không giới hạn'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${voucher.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {voucher.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(voucher)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(voucher.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Tiếp
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
