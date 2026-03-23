'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface MenuItem {
  id: number;
  parentId: number | null;
  location: string;
  title: string;
  titleEn: string | null;
  href: string;
  icon: string | null;
  order: number;
  isActive: number;
  children?: MenuItem[];
}

const LOCATIONS = [
  { id: 'header', name: 'Thanh điều hướng (Header)' },
  { id: 'footer_main', name: 'Chân trang - Cột chính (Link lớn)' },
  { id: 'footer_help', name: 'Chân trang - Cột Trợ giúp' },
  { id: 'footer_company', name: 'Chân trang - Cột Công ty' },
  { id: 'footer_promos', name: 'Chân trang - Cột Khuyến mãi' },
  { id: 'footer_bottom', name: 'Chân trang - Dưới cùng' },
];

export default function AdminMenuManager() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState('header');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    id: null as number | null,
    parentId: null as number | null,
    title: '',
    titleEn: '',
    href: '',
    location: activeLocation === 'all' ? 'header' : activeLocation,
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchMenus();
  }, [activeLocation]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/menus?location=${activeLocation}`);
      const data = await response.json();
      if (data.success) {
        setMenus(data.data);
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      parentId: null,
      title: '',
      titleEn: '',
      href: '',
      location: activeLocation,
      order: 0,
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/menus', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(editingId && { id: editingId }),
          titleEn: formData.titleEn || null, // Ensure titleEn is null if empty string
        }),
      });

      if (response.ok) {
        resetForm();
        fetchMenus();
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleEdit = (m: MenuItem) => {
    setFormData({
      id: m.id,
      title: m.title,
      titleEn: m.titleEn || '',
      href: m.href || '',
      location: m.location,
      parentId: m.parentId,
      order: m.order,
      isActive: m.isActive === 1,
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa mục menu này?')) return;
    try {
      await fetch(`/api/admin/menus?id=${id}`, { method: 'DELETE' });
      fetchMenus();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 text-black">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Menu</h1>
            <p className="text-gray-500">Quản lý các liên kết điều hướng trên Header và Footer</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              setFormData((f) => ({ ...f, location: activeLocation }));
            }}
            className="px-4 py-2 bg-black text-white rounded-lg"
          >
            + Thêm mục mới
          </button>
        </div>

        <div className="flex gap-4 border-b">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setActiveLocation(loc.id)}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${activeLocation === loc.id ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
            >
              {loc.name}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold mb-4">
              {editingId ? 'Sửa mục menu' : 'Thêm mục menu mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên hiển thị *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-black"
                  placeholder="Ví dụ: Giày Nam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tên Menu (Tiếng Anh)</label>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-black"
                  placeholder="VD: Men, Women, Jordan..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Đường dẫn (HREF) *</label>
                <input
                  type="text"
                  required
                  value={formData.href}
                  onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                  className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-black"
                  placeholder="/men hoặc https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cấp cha (Nếu có)</label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentId: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full border p-2 rounded"
                >
                  <option value="">-- Không có (Cấp cao nhất) --</option>
                  {menus
                    .filter((m) => !m.parentId && m.id !== editingId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vị trí hiển thị</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select
                    value={formData.isActive ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === '1' })}
                    className="w-full border p-2 rounded"
                  >
                    <option value="1">Kích hoạt</option>
                    <option value="0">Tạm ẩn</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-6 py-2 bg-black text-white rounded-lg">
                  Lưu lại
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border rounded-lg"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Đang tải dữ liệu...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Liên kết
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Vị trí
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menus.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      {m.parentId ? <span className="text-gray-400 mr-2">┗</span> : null}
                      {m.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{m.href}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{m.order}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] ${m.isActive === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {m.isActive === 1 ? 'HIỂN THỊ' : 'ĐANG ẨN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      <button onClick={() => handleEdit(m)} className="text-blue-600 font-medium">
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-500 font-medium font-medium"
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
      </div>
    </AdminLayout>
  );
}
