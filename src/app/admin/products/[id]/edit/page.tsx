'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  base_price: number;
  retail_price: number;
  category_id: number;
  brand_id: number;
  is_new_arrival: boolean;
  is_active: boolean;
  image_url: string;
  gallery_images: string[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    base_price: 0,
    retail_price: 0,
    category_id: 1,
    brand_id: 1,
    is_new_arrival: false,
    is_active: true,
    image_url: '',
    gallery_images: [],
  });

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${productId}`);
        const result = await response.json();

        if (result.success || response.ok) {
          const product = result.data || result;


          // Extract image URL from various sources
          let imageUrl = '';
          const galleryUrls: string[] = [];

          if (product.images && product.images.length > 0) {
            // Find main image or use first image
            const mainImage = product.images.find((img: any) => img.is_main === 1);
            imageUrl = mainImage ? mainImage.url : product.images[0].url;

            // Get gallery images
            product.images.forEach((img: any) => {
              if (img.is_main === 0) {
                galleryUrls.push(img.url);
              }
            });
          } else if (product.image_url) {
            imageUrl = product.image_url;
          } else if (product.featured_image) {
            imageUrl = product.featured_image;
          }

          setFormData({
            name: product.name || '',
            sku: product.sku || '',
            description: product.description || '',
            base_price: product.base_price || 0,
            retail_price: product.retail_price || 0,
            category_id: product.category_id || 1,
            brand_id: product.brand_id || 1,
            is_new_arrival: product.is_new_arrival === 1 || product.is_new_arrival === true,
            is_active: product.is_active === 1 || product.is_active === true,
            image_url: imageUrl,
            gallery_images: galleryUrls,
          });
        }
      } catch (err) {
        setError('Lỗi khi tải sản phẩm');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...formData.gallery_images];
    newGallery[index] = value;
    setFormData(prev => ({ ...prev, gallery_images: newGallery }));
  };

  const addGalleryImage = () => {
    setFormData(prev => ({
      ...prev,
      gallery_images: [...prev.gallery_images, '']
    }));
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = formData.gallery_images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, gallery_images: newGallery }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Ensure is_new_arrival is sent as 0/1 for SQL
      const submissionData = {
        ...formData,
        is_new_arrival: formData.is_new_arrival ? 1 : 0,
        is_active: formData.is_active ? 1 : 0
      };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (result.success || response.ok) {
        router.push('/admin/products');
      } else {
        setError(result.message || 'Lỗi khi cập nhật sản phẩm');
      }
    } catch (err) {
      setError('Có lỗi xảy ra');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
            <p className="mt-1 text-sm text-gray-500">Cập nhật thông tin sản phẩm</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
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
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá gốc (retail price)
                </label>
                <input
                  type="number"
                  name="retail_price"
                  value={formData.retail_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Danh mục và Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL ảnh chính *
                </label>
                <div className="flex gap-4">
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border border-gray-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  </div>
                )}
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
                  {formData.gallery_images.map((url, index) => (
                    <div key={index} className="flex flex-col gap-2 p-3 bg-white rounded border border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleGalleryChange(index, e.target.value)}
                          className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Link ảnh phụ..."
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          Xóa
                        </button>
                      </div>
                      {url && (
                        <img
                          src={url}
                          alt={`Gallery ${index}`}
                          className="w-16 h-16 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />
                      )}
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
                disabled={saving}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
