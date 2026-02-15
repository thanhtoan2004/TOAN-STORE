'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDateTime, formatDate, formatCurrency } from '@/lib/date-utils';

interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  starts_at?: string;
  ends_at?: string;
  usage_limit?: number;
  usage_limit_per_user?: number;
  times_used?: number;
  applicable_tier: string;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    usage_limit_per_user: '',
    starts_at: '',
    ends_at: '',
    applicable_tier: 'bronze',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/promo-codes');
      const data = await response.json();

      if (data.success) {
        setCoupons(data.data?.coupons || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_limit_per_user: formData.usage_limit_per_user ? parseInt(formData.usage_limit_per_user) : null,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        applicable_tier: formData.applicable_tier
      };

      const url = editingCoupon ? `/api/admin/promo-codes/${editingCoupon.id}` : '/api/admin/promo-codes';
      const method = editingCoupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        fetchCoupons();
        resetForm();
      } else {
        setError(data.message || 'Lỗi khi lưu coupon');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      setError('Lỗi server');
    }
  };

  const deleteCoupon = async (couponId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa coupon này?')) return;

    try {
      const response = await fetch(`/api/admin/promo-codes/${couponId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const editCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);

    // Helper to format date for datetime-local input (YYYY-MM-DDThh:mm)
    const formatForInput = (dateStr?: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      // Adjust to local time string
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: (coupon.min_order_amount || '').toString(),
      max_discount_amount: (coupon.max_discount_amount || '').toString(),
      usage_limit: (coupon.usage_limit || '').toString(),
      usage_limit_per_user: (coupon.usage_limit_per_user || '').toString(),
      starts_at: formatForInput(coupon.starts_at),
      ends_at: formatForInput(coupon.ends_at),
      applicable_tier: coupon.applicable_tier || 'bronze',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCoupon(null);
    setError('');
    setFormData({
      code: '',
      description: '',
      discount_type: 'percent',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      usage_limit_per_user: '',
      starts_at: '',
      ends_at: '',
      applicable_tier: 'bronze',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Coupons</h1>
            <p className="mt-1 text-sm text-gray-500">Quản lý mã giảm giá</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            {showForm ? 'Hủy' : '+ Tạo Coupon'}
          </button>
        </div>

        {/* Coupon Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingCoupon ? 'Chỉnh sửa Coupon' : 'Tạo Coupon Mới'}
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã Coupon *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="VD: SUMMER50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giảm giá *
                </label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá trị giảm *
                </label>
                <input
                  type="number"
                  name="discount_value"
                  required
                  step="0.01"
                  value={formData.discount_value}
                  onChange={handleChange}
                  placeholder="VD: 50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả coupon"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền đơn hàng tối thiểu
                </label>
                <input
                  type="number"
                  name="min_order_amount"
                  step="1000"
                  value={formData.min_order_amount}
                  onChange={handleChange}
                  placeholder="VD: 500000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giảm giá tối đa
                </label>
                <input
                  type="number"
                  name="max_discount_amount"
                  step="1000"
                  value={formData.max_discount_amount}
                  onChange={handleChange}
                  placeholder="VD: 100000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tổng số lần sử dụng
                </label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit}
                  onChange={handleChange}
                  placeholder="Để trống = không giới hạn"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lần dùng/người
                </label>
                <input
                  type="number"
                  name="usage_limit_per_user"
                  value={formData.usage_limit_per_user}
                  onChange={handleChange}
                  placeholder="Để trống = không giới hạn"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu
                </label>
                <input
                  type="datetime-local"
                  name="starts_at"
                  value={formData.starts_at}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="datetime-local"
                  name="ends_at"
                  value={formData.ends_at}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hạng thành viên áp dụng
                </label>
                <select
                  name="applicable_tier"
                  value={formData.applicable_tier}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="bronze">Bronze (Tất cả)</option>
                  <option value="silver">Silver trở lên</option>
                  <option value="gold">Gold trở lên</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors mr-2"
                >
                  {editingCoupon ? 'Cập nhật Coupon' : 'Tạo Coupon'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-600">Chưa có coupon nào</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điều kiện
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      {coupon.description && (
                        <div className="text-xs text-gray-500">{coupon.description}</div>
                      )}
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${coupon.applicable_tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                          coupon.applicable_tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                            coupon.applicable_tier === 'silver' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {coupon.applicable_tier || 'bronze'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.discount_type === 'percent'
                          ? `${coupon.discount_value}%`
                          : formatCurrency(coupon.discount_value)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {coupon.min_order_amount && (
                        <div>Tối thiểu: {formatCurrency(coupon.min_order_amount)}</div>
                      )}
                      {coupon.max_discount_amount && (
                        <div>Tối đa: {formatCurrency(coupon.max_discount_amount)}</div>
                      )}
                      {coupon.usage_limit && (
                        <div>
                          Đã dùng: {coupon.times_used || 0}/{coupon.usage_limit}
                          <span className="ml-2 text-xs">
                            (Còn {Math.max(0, coupon.usage_limit - (coupon.times_used || 0))})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {coupon.starts_at && (
                        <div>{formatDate(coupon.starts_at)}</div>
                      )}
                      {coupon.ends_at && (
                        <div>→ {formatDate(coupon.ends_at)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => editCoupon(coupon)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteCoupon(coupon.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
