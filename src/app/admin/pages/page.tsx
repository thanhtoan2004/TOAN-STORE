'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  isActive: number;
  metaTitle: string;
  metaDescription: string;
  createdAt: string;
}

export default function AdminPagesManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    isActive: true,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pages');
      const data = await response.json();
      if (data.success) {
        setPages(data.data);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/pages', {
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
          title: '',
          slug: '',
          content: '',
          metaTitle: '',
          metaDescription: '',
          isActive: true,
        });
        fetchPages();
      }
    } catch (error) {
      console.error('Error saving page:', error);
    }
  };

  const handleEdit = (p: Page) => {
    setFormData({
      title: p.title,
      slug: p.slug,
      content: p.content || '',
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      isActive: p.isActive === 1,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa trang này?')) return;
    try {
      const response = await fetch(`/api/admin/pages?id=${id}`, { method: 'DELETE' });
      if (response.ok) fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Trang nội dung</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý Chính sách, Giới thiệu, và các trang CMS khác
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                title: '',
                slug: '',
                content: '',
                metaTitle: '',
                metaDescription: '',
                isActive: true,
              });
            }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            + Tạo trang mới
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Sửa trang' : 'Tạo trang mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tiêu đề trang *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-black"
                    placeholder="Ví dụ: Chính sách bảo hành"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (Đường dẫn) *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-black"
                    placeholder="chinh-sach-bao-hanh"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nội dung (HTML chuyên sâu)</label>
                <textarea
                  rows={15}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border p-2 rounded font-mono text-sm outline-none focus:ring-1 focus:ring-black"
                  placeholder="Nhập nội dung HTML của trang..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Title (SEO)</label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    className="w-full border p-2 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select
                    value={formData.isActive ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === '1' })}
                    className="w-full border p-2 rounded text-sm"
                  >
                    <option value="1">Hiển thị</option>
                    <option value="0">Ẩn</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Lưu trang
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
            <div className="p-12 text-center text-gray-500">Đang tải danh sách trang...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Trang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">/help/{p.slug}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${p.isActive === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {p.isActive === 1 ? 'Hoạt động' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEdit(p)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                      <a
                        href={`/help/${p.slug}`}
                        target="_blank"
                        className="text-gray-500 hover:text-black"
                      >
                        Xem
                      </a>
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
