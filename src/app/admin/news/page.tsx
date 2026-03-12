'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/utils/date-utils';

interface News {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  author_name: string;
  is_published: number;
  views: number;
  published_at: string | null;
  created_at: string;
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    category: '',
    is_published: false,
  });

  useEffect(() => {
    fetchNews();
  }, [search, categoryFilter, publishedFilter]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (publishedFilter) params.append('published', publishedFilter);

      const response = await fetch(`/api/admin/news?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setNews(data.data.news);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingNews ? `/api/admin/news/${editingNews.id}` : '/api/admin/news';
      const method = editingNews ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert(editingNews ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
        setShowForm(false);
        setEditingNews(null);
        resetForm();
        fetchNews();
      } else {
        alert(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving news:', error);
      alert('Lỗi khi lưu tin tức');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa tin tức này?')) return;

    try {
      const response = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        alert('Xóa thành công!');
        fetchNews();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Lỗi khi xóa tin tức');
    }
  };

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      excerpt: newsItem.excerpt || '',
      content: newsItem.content,
      image_url: newsItem.image_url || '',
      category: newsItem.category || '',
      is_published: newsItem.is_published === 1,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      image_url: '',
      category: '',
      is_published: false,
    });
  };

  // formatDate removed

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Quản Lý Tin Tức</h1>
          <button
            onClick={() => {
              setEditingNews(null);
              resetForm();
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            {showForm ? 'Hủy' : '+ Tạo Tin Mới'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">
              {editingNews ? 'Chỉnh Sửa Tin Tức' : 'Tạo Tin Tức Mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Nhập tiêu đề tin tức"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mô tả ngắn</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Mô tả ngắn gọn về tin tức"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nội dung *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Nội dung chi tiết của tin tức"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">URL Hình ảnh</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    <option value="Sản Phẩm">Sản Phẩm</option>
                    <option value="Thể Thao">Thể Thao</option>
                    <option value="Bền Vững">Bền Vững</option>
                    <option value="Công Ty">Công Ty</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_published" className="text-sm font-medium">
                  Xuất bản ngay
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  {editingNews ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingNews(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Tất cả danh mục</option>
              <option value="Sản Phẩm">Sản Phẩm</option>
              <option value="Thể Thao">Thể Thao</option>
              <option value="Bền Vững">Bền Vững</option>
              <option value="Công Ty">Công Ty</option>
            </select>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        </div>

        {/* News Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Danh mục</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tác giả</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Lượt xem</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Ngày tạo</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : news.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Không có tin tức nào
                  </td>
                </tr>
              ) : (
                news.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            width={60}
                            height={40}
                            className="object-cover rounded"
                          />
                        )}
                        <div className="max-w-xs">
                          <p className="font-medium line-clamp-1">{item.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{item.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{item.category || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.author_name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{item.views}</td>
                    <td className="px-4 py-3 text-center text-sm">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
