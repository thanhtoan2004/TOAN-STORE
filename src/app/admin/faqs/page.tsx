'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category_id: number;
  position: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category_id: 1,
    position: 0,
    is_active: true
  });

  useEffect(() => {
    fetchFAQs();
  }, [page]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/faqs?page=${page}&limit=20`);
      const data = await response.json();

      if (data.success) {
        setFaqs(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/faqs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(editingId && { id: editingId })
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(editingId ? 'Cập nhật thành công' : 'Tạo thành công');
        setFormData({ question: '', answer: '', category_id: 1, position: 0, is_active: true });
        setEditingId(null);
        setShowForm(false);
        fetchFAQs();
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Lỗi khi lưu');
    }
  };

  const handleEdit = (faq: FAQ) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category_id: faq.category_id || 1,
      position: faq.position,
      is_active: faq.is_active === 1
    });
    setEditingId(faq.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;

    try {
      const response = await fetch(`/api/admin/faqs?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Xóa thành công');
        fetchFAQs();
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Lỗi khi xóa');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ question: '', answer: '', category_id: 1, position: 0, is_active: true });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý FAQs</h1>
            <p className="mt-1 text-sm text-gray-500">Quản lý các câu hỏi thường gặp</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Thêm FAQ
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Câu hỏi *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nhập câu hỏi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Câu trả lời *
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  rows={5}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nhập câu trả lời"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Danh mục
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: parseInt(e.target.value) })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="1">Đặt hàng</option>
                    <option value="2">Vận chuyển</option>
                    <option value="3">Thanh toán</option>
                    <option value="4">Đổi trả</option>
                    <option value="5">Sản phẩm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vị trí
                  </label>
                  <input
                    type="number"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: parseInt(e.target.value) })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trạng thái
                  </label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.value === '1' })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="1">Hoạt động</option>
                    <option value="0">Vô hiệu</option>
                  </select>
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
          ) : faqs.length === 0 ? (
            <div className="text-center p-8 text-gray-500">Chưa có FAQs nào</div>
          ) : (
            <>
              <div className="divide-y">
                {faqs.map((faq) => (
                  <div key={faq.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                        <p className="mt-2 text-gray-600">{faq.answer}</p>
                        <div className="mt-2 flex gap-2 items-center">
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            Vị trí: {faq.position}
                          </span>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${faq.is_active === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {faq.is_active === 1 ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(faq)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
