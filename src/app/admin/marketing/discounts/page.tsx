'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Plus,
  Trash2,
  Tag,
  Settings,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
  Percent,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BulkDiscount {
  id: number;
  name: string;
  discountPercentage: number;
  categoryId: number | null;
  categoryName: string | null;
  startTime: string;
  endTime: string;
  isActive: number;
}

export default function BulkDiscountPage() {
  const [discounts, setDiscounts] = useState<BulkDiscount[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New discount form
  const [formData, setFormData] = useState({
    name: '',
    discountPercentage: 10,
    categoryId: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    fetchDiscounts();
    fetchCategories();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/marketing/bulk-discounts');
      const data = await res.json();
      if (data.success) setDiscounts(data.data);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    if (data.success) setCategories(data.data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/admin/marketing/bulk-discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Đã lên lịch chiến dịch mới');
        setShowModal(false);
        fetchDiscounts();
      }
    } catch (error) {
      toast.error('Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const isExpired = (endTime: string) => new Date(endTime) < new Date();
  const isStarted = (startTime: string) => new Date(startTime) <= new Date();

  const getStatus = (discount: BulkDiscount) => {
    if (discount.isActive === 0) return { label: 'Tạm dừng', color: 'bg-gray-100 text-gray-800' };
    if (isExpired(discount.endTime))
      return { label: 'Đã kết thúc', color: 'bg-red-100 text-red-800' };
    if (!isStarted(discount.startTime))
      return { label: 'Chờ bắt đầu', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Đang chạy', color: 'bg-green-100 text-green-800' };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Percent className="w-6 h-6 text-indigo-600" />
              Chiến dịch Giảm giá (Bulk Discount)
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Lên lịch giảm giá hàng loạt cho toàn bộ danh mục sản phẩm
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:translate-y-[-1px] transition-all"
          >
            <Plus size={18} /> Lên lịch chiến dịch
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500 mb-2" />
              <p className="text-gray-400">Đang đồng bộ chiến dịch...</p>
            </div>
          ) : discounts.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <Tag className="w-12 h-12 mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">
                Chưa có chiến dịch giảm giá nào được lên lịch
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-500 text-sm font-bold mt-2 hover:underline"
              >
                Tạo chiến dịch ngay
              </button>
            </div>
          ) : (
            discounts.map((discount) => {
              const status = getStatus(discount);
              return (
                <div
                  key={discount.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-2xl font-black text-indigo-600">
                        -{discount.discountPercentage}%
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">
                        {discount.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
                        <Tag size={12} className="text-gray-400" />
                        Áp dụng:{' '}
                        <span className="text-indigo-600">
                          {discount.categoryName || 'Tất cả sản phẩm'}
                        </span>
                      </p>
                    </div>

                    <div className="pt-2 space-y-2 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <Calendar size={12} />
                        <span>Từ: {new Date(discount.startTime).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <Clock size={12} />
                        <span>Đến: {new Date(discount.endTime).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-all">
                      <Settings size={16} />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Creating */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Chiến dịch Marketing Mới</h3>
              <button onClick={() => setShowModal(false)}>
                <XCircle className="text-gray-400 pointer hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Tên chiến dịch
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Flash Sale Cuối Tuần"
                  className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Mức giảm (%)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="99"
                    value={formData.discountPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Danh mục áp dụng
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Thời gian bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Thời gian kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-gray-800 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Kích hoạt chiến dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
