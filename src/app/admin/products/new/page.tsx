'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import AdminMediaUpload from '@/components/admin/AdminMediaUpload';

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price_cache: number;
  msrp_price: number;
  category_id: number;
  brand_id: number;
  is_new_arrival: boolean;
  is_active: boolean;
  image_url: string;
  main_media_type?: 'image' | 'video';
  gallery_images: ({ url: string; type: 'image' | 'video' } | string)[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    price_cache: 0,
    msrp_price: 0,
    category_id: 1,
    brand_id: 1,
    is_new_arrival: false,
    is_active: true,
    image_url: '',
    main_media_type: 'image',
    gallery_images: [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleGalleryUpdate = (index: number, url: string, type: 'image' | 'video') => {
    const newGallery = [...formData.gallery_images];
    newGallery[index] = { url, type };
    setFormData((prev) => ({ ...prev, gallery_images: newGallery }));
  };

  const addGalleryImage = () => {
    setFormData((prev) => ({
      ...prev,
      gallery_images: [...prev.gallery_images, { url: '', type: 'image' }],
    }));
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = formData.gallery_images.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, gallery_images: newGallery }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submissionData = {
        ...formData,
        is_new_arrival: formData.is_new_arrival ? 1 : 0,
        is_active: formData.is_active ? 1 : 0,
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (result.success || response.ok) {
        router.push('/admin/products');
      } else {
        setError(result.message || 'Lỗi khi tạo sản phẩm');
      }
    } catch (err) {
      setError('Có lỗi xảy ra');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tạo sản phẩm mới</h1>
            <p className="mt-1 text-sm text-gray-500">Thêm sản phẩm vào hệ thống</p>
          </div>
          <Link href="/admin/products">
            <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Quay lại
            </button>
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tên sản phẩm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Nike Air Max..."
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="AM-001-BLK"
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Nhập mô tả chi tiết sản phẩm..."
              />
            </div>

            {/* Giá */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá bán (base price) *
                </label>
                <input
                  type="number"
                  name="price_cache"
                  value={formData.price_cache}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá gốc (retail price)
                </label>
                <input
                  type="number"
                  name="msrp_price"
                  value={formData.msrp_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Danh mục và Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value={1}>Running</option>
                  <option value={2}>Basketball</option>
                  <option value={3}>Training</option>
                  <option value={4}>Lifestyle</option>
                  <option value={5}>Jordan</option>
                  <option value={6}>Football</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                <select
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value={1}>Nike</option>
                  <option value={2}>Jordan</option>
                  <option value={3}>Nike SB</option>
                </select>
              </div>
            </div>

            {/* URL ảnh chính */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Hình ảnh sản phẩm</h3>

              <div className="mb-6">
                <AdminMediaUpload
                  label="Ảnh/Video chính *"
                  initialUrl={formData.image_url}
                  initialType={formData.main_media_type || 'image'}
                  onUploadComplete={(url, type) =>
                    setFormData((prev) => ({ ...prev, image_url: url, main_media_type: type }))
                  }
                  onRemove={() =>
                    setFormData((prev) => ({ ...prev, image_url: '', main_media_type: 'image' }))
                  }
                />
              </div>

              {/* Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ảnh phụ (Gallery)
                  </label>
                  <button
                    type="button"
                    onClick={addGalleryImage}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Thêm ảnh
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.gallery_images.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 bg-white rounded border border-gray-200"
                    >
                      <AdminMediaUpload
                        label={`Ảnh phụ ${index + 1}`}
                        initialUrl={typeof item === 'string' ? item : item.url}
                        initialType={typeof item === 'string' ? 'image' : item.type}
                        onUploadComplete={(url, type) => handleGalleryUpdate(index, url, type)}
                        onRemove={() => removeGalleryImage(index)}
                      />
                    </div>
                  ))}
                  {formData.gallery_images.length === 0 && (
                    <p className="text-sm text-gray-400 italic">Chưa có ảnh phụ nào</p>
                  )}
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_new_arrival"
                checked={formData.is_new_arrival}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-black"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Đánh dấu là sản phẩm mới
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-black"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Đang kinh doanh (Active)
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Tạo sản phẩm'}
              </button>
              <Link href="/admin/products">
                <button
                  type="button"
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
