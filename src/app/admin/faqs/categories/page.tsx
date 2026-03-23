'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface HelpLink {
  name: string;
  href: string;
}

interface FAQCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  position: number;
  sectionLinks: HelpLink[];
  isActive: number;
}

export default function AdminFAQCategoriesPage() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    position: 0,
    isActive: true,
    sectionLinks: [] as HelpLink[],
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/faqs/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/faqs/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(editingId && { id: editingId }),
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          slug: '',
          description: '',
          icon: '',
          position: 0,
          isActive: true,
          sectionLinks: [],
        });
        fetchCategories();
      }
    } catch (error) {
      console.error('Error saving FAQ category:', error);
    }
  };

  const handleEdit = (cat: FAQCategory) => {
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '',
      position: cat.position,
      isActive: cat.isActive === 1,
      sectionLinks: Array.isArray(cat.sectionLinks) ? cat.sectionLinks : [],
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const addLink = () => {
    setFormData({
      ...formData,
      sectionLinks: [...formData.sectionLinks, { name: '', href: '' }],
    });
  };

  const updateLink = (index: number, field: 'name' | 'href', value: string) => {
    const newLinks = [...formData.sectionLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, sectionLinks: newLinks });
  };

  const removeLink = (index: number) => {
    setFormData({
      ...formData,
      sectionLinks: formData.sectionLinks.filter((_, i) => i !== index),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Danh mục FAQ</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý danh mục và các thẻ hỗ trợ ngoài trang Help
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
            }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            + Thêm danh mục
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên danh mục</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
                    placeholder="Ví dụ: Đơn hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
                    placeholder="vi-du-don-hang"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vị trí</label>
                  <input
                    type="number"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: parseInt(e.target.value) })
                    }
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select
                    value={formData.isActive ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === '1' })}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="1">Hoạt động</option>
                    <option value="0">Vô hiệu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Các liên kết hỗ trợ (Cấu hình "Thẻ hỗ trợ")
                </label>
                <div className="space-y-2">
                  {formData.sectionLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-dashed"
                    >
                      <input
                        type="text"
                        placeholder="Tên link (Ví dụ: Trạng thái)"
                        value={link.name}
                        onChange={(e) => updateLink(idx, 'name', e.target.value)}
                        className="flex-1 text-sm border p-1 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Đường dẫn (Ví dụ: /orders)"
                        value={link.href}
                        onChange={(e) => updateLink(idx, 'href', e.target.value)}
                        className="flex-1 text-sm border p-1 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLink}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Thêm dòng liên kết
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="px-6 py-2 bg-black text-white rounded-lg">
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Đang tải...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Tên & Thẻ hỗ trợ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Vị trí
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{cat.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Array.isArray(cat.sectionLinks) && cat.sectionLinks.length > 0 ? (
                          <span className="text-blue-600">
                            {cat.sectionLinks.length} liên kết cấu hình
                          </span>
                        ) : (
                          <span className="text-gray-400">Không có thẻ liên kết</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cat.position}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${cat.isActive === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {cat.isActive === 1 ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Sửa
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
