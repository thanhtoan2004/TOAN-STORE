'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Banner {
  id: number;
  title: string;
  description: string;
  image_url: string;
  mobile_image_url?: string;
  link_url: string;
  link_text?: string;
  position: string;
  display_order: number;
  start_date?: string;
  end_date?: string;
  is_active: number;
  click_count: number;
  impression_count: number;
  created_at: string;
  updated_at: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    mobile_image_url: '',
    link_url: '',
    link_text: '',
    position: 'homepage',
    display_order: '1',
    start_date: '',
    end_date: '',
    is_active: 1,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners');
      const data = await response.json();

      if (data.success) {
        setBanners(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingBanner ? 'PUT' : 'POST';
      const body = editingBanner
        ? { id: editingBanner.id, ...formData }
        : formData;

      const response = await fetch('/api/admin/banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchBanners();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const deleteBanner = async (bannerId: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await fetch(`/api/admin/banners?id=${bannerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBanners();
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const toggleBannerStatus = async (bannerId: number, currentStatus: number) => {
    try {
      const response = await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bannerId,
          is_active: currentStatus === 1 ? 0 : 1
        }),
      });

      if (response.ok) {
        fetchBanners();
      }
    } catch (error) {
      console.error('Error updating banner:', error);
    }
  };

  const editBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url,
      mobile_image_url: banner.mobile_image_url || '',
      link_url: banner.link_url || '',
      link_text: banner.link_text || '',
      position: banner.position || 'homepage',
      display_order: banner.display_order.toString(),
      start_date: banner.start_date || '',
      end_date: banner.end_date || '',
      is_active: banner.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      mobile_image_url: '',
      link_url: '',
      link_text: '',
      position: 'homepage',
      display_order: '1',
      start_date: '',
      end_date: '',
      is_active: 1,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
            <p className="mt-1 text-sm text-gray-500">Manage homepage banners</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Banner'}
          </button>
        </div>

        {/* Banner Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="mt-2 h-40 object-cover rounded"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Text
                </label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  placeholder="e.g. Mua Ngay, Xem thêm"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="homepage">Homepage</option>
                    <option value="home_featured">Featured Section (Home)</option>
                    <option value="category">Category</option>
                    <option value="product">Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Banners Grid */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Loading banners...</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {banners.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No banners found. Create your first banner!
                </div>
              ) : (
                banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="border border-gray-200 rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-50"
                  >
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                      {banner.description && (
                        <p className="text-sm text-gray-600 mt-1">{banner.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">Order: {banner.display_order}</span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${banner.is_active === 1
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {banner.is_active === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => editBanner(banner)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                        className={`px-3 py-1 text-sm border rounded hover:opacity-80 ${banner.is_active === 1
                          ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                          : 'border-green-300 text-green-700 bg-green-50'
                          }`}
                      >
                        {banner.is_active === 1 ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteBanner(banner.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
