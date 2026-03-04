'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  position: number;
  isActive: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '', imageUrl: '', position: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '', imageUrl: '', position: 0 });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();

      if (data.success) {
        // Sort by position
        const sorted = (data.data || []).sort((a: Category, b: Category) => a.position - b.position);
        setCategories(sorted);
      } else if (Array.isArray(data)) {
        const sorted = data.sort((a: Category, b: Category) => a.position - b.position);
        setCategories(sorted);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        setNewCategory({ name: '', slug: '', description: '', imageUrl: '', position: 0 });
        fetchCategories();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl || '',
      position: category.position
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const response = await fetch(`/api/admin/categories/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setEditingId(null);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Optimistic update
    const reordered = Array.from(categories);
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);

    // Update positions
    const updated = reordered.map((cat, index) => ({ ...cat, position: index }));
    setCategories(updated);

    // Persist to server
    setSaving(true);
    try {
      await fetch('/api/admin/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updated.map(cat => ({ id: cat.id, position: cat.position }))
        })
      });
    } catch (error) {
      console.error('Error saving order:', error);
      fetchCategories(); // Rollback on error
    } finally {
      setSaving(false);
    }
  }, [categories]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Danh mục</h1>
            <p className="mt-1 text-sm text-gray-500">Thêm, sửa, xóa và kéo thả sắp xếp danh mục sản phẩm</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-sm text-blue-600 flex items-center gap-1">
                <span className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                Đang lưu...
              </span>
            )}
            <div className="text-sm font-medium bg-gray-100 px-4 py-2 rounded-full">
              Total Categories: <span className="font-bold">{categories.length}</span>
            </div>
          </div>
        </div>

        {/* Drag hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Kéo thả các hàng trong bảng bên dưới để sắp xếp thứ tự danh mục. Thay đổi được lưu tự động.
        </div>

        {/* Form Thêm */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Thêm danh mục mới</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Tên danh mục"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Slug"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <textarea
              placeholder="Mô tả"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <input
              type="text"
              placeholder="URL Hình ảnh"
              value={newCategory.imageUrl}
              onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Vị trí"
              value={newCategory.position}
              onChange={(e) => setNewCategory({ ...newCategory, position: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Thêm danh mục
            </button>
          </form>
        </div>

        {/* Danh sách with Drag & Drop */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8">Đang tải...</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-3 py-3"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vị trí</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                  </tr>
                </thead>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <tbody
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="divide-y divide-gray-200"
                    >
                      {editingId ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4">
                            <form onSubmit={handleUpdate} className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                <input
                                  type="text"
                                  value={editForm.slug}
                                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                  className="px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                rows={2}
                                placeholder="Mô tả"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                              <input
                                type="text"
                                value={editForm.imageUrl}
                                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                                placeholder="URL Hình ảnh"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                              <input
                                type="number"
                                value={editForm.position}
                                onChange={(e) => setEditForm({ ...editForm, position: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                              <div className="flex gap-2">
                                <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded-lg">Lưu</button>
                                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-2 bg-gray-400 text-white rounded-lg">Hủy</button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : null}
                      {categories.map((cat, index) => (
                        <Draggable key={cat.id} draggableId={String(cat.id)} index={index}>
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${snapshot.isDragging ? 'bg-blue-50 shadow-lg' : 'hover:bg-gray-50'} transition-colors`}
                              style={{
                                ...provided.draggableProps.style,
                                display: snapshot.isDragging ? 'table' : undefined,
                                width: snapshot.isDragging ? '100%' : undefined,
                              }}
                            >
                              <td
                                {...provided.dragHandleProps}
                                className="w-10 px-3 py-4 text-gray-400 cursor-grab active:cursor-grabbing"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="9" cy="6" r="1.5" />
                                  <circle cx="15" cy="6" r="1.5" />
                                  <circle cx="9" cy="12" r="1.5" />
                                  <circle cx="15" cy="12" r="1.5" />
                                  <circle cx="9" cy="18" r="1.5" />
                                  <circle cx="15" cy="18" r="1.5" />
                                </svg>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{cat.description?.substring(0, 50)}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{cat.position}</td>
                              <td className="px-6 py-4 text-right text-sm space-x-2">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEdit(cat)}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    onClick={() => handleDelete(cat.id)}
                                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </table>
            </DragDropContext>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
