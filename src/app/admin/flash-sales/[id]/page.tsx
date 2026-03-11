'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { ArrowLeft, Save, Plus, Trash2, Search, Package } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  sku: string;
  price_cache: number;
}

interface FlashSaleItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  flash_price: number;
  discount_percentage: number;
  quantity_limit: number;
  quantity_sold: number;
}

interface FlashSale {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: number;
  items: FlashSaleItem[];
}

export default function FlashSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);

  // States for adding products
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    productId: 0,
    productName: '',
    flashPrice: 0,
    quantityLimit: 100,
    discountPercentage: 0,
  });

  useEffect(() => {
    fetchFlashSale();
  }, [id]);

  const fetchFlashSale = async () => {
    try {
      const response = await fetch(`/api/admin/flash-sales/${id}`);
      const result = await response.json();
      if (result.success) {
        setFlashSale(result.data);
      }
    } catch (error) {
      console.error('Error fetching flash sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashSale) return;

    try {
      const response = await fetch(`/api/admin/flash-sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flashSale.name,
          description: flashSale.description,
          startTime: flashSale.start_time.replace(' ', 'T'),
          endTime: flashSale.end_time.replace(' ', 'T'),
          isActive: flashSale.is_active,
        }),
      });

      if (response.ok) {
        alert('Cập nhật thành công');
      }
    } catch (error) {
      console.error('Error updating flash sale:', error);
    }
  };

  const searchProducts = async () => {
    if (!searchTerm) return;
    setSearching(true);
    try {
      const response = await fetch(`/api/admin/products?search=${searchTerm}&limit=10`);
      const result = await response.json();
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const addItemToFlashSale = async () => {
    if (!newItem.productId || !newItem.flashPrice) return;

    try {
      const response = await fetch(`/api/admin/flash-sales/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewItem({
          productId: 0,
          productName: '',
          flashPrice: 0,
          quantityLimit: 100,
          discountPercentage: 0,
        });
        setSearchTerm('');
        setSearchResults([]);
        fetchFlashSale();
      }
    } catch (error) {
      console.error('Add item error:', error);
    }
  };

  const deleteItem = async (productId: number) => {
    if (!confirm('Xóa sản phẩm này khỏi Flash Sale?')) return;

    try {
      const response = await fetch(`/api/admin/flash-sales/${id}/items?productId=${productId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchFlashSale();
      }
    } catch (error) {
      console.error('Delete item error:', error);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="text-center py-20">Đang tải...</div>
      </AdminLayout>
    );
  if (!flashSale)
    return (
      <AdminLayout>
        <div className="text-center py-20">Không tìm thấy Flash Sale</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/flash-sales" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Chi tiết Flash Sale</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Thông tin chung */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">Thông tin chương trình</h2>
              <form onSubmit={handleUpdateFlashSale} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tên chương trình
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                    value={flashSale.name}
                    onChange={(e) => setFlashSale({ ...flashSale, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                    rows={3}
                    value={flashSale.description}
                    onChange={(e) => setFlashSale({ ...flashSale, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bắt đầu</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                    value={flashSale.start_time.replace(' ', 'T').substring(0, 16)}
                    onChange={(e) => setFlashSale({ ...flashSale, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kết thúc</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                    value={flashSale.end_time.replace(' ', 'T').substring(0, 16)}
                    onChange={(e) => setFlashSale({ ...flashSale, end_time: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={flashSale.is_active === 1}
                    onChange={(e) =>
                      setFlashSale({ ...flashSale, is_active: e.target.checked ? 1 : 0 })
                    }
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Kích hoạt
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu thông tin
                </button>
              </form>
            </div>
          </div>

          {/* Quản lý Sản phẩm */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Sản phẩm tham gia ({flashSale.items.length})</h2>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Thêm sản phẩm
                </button>
              </div>

              {showAddForm && (
                <div className="mb-8 p-4 bg-gray-50 border rounded-lg space-y-4">
                  <h3 className="font-bold text-sm">Tìm và thêm sản phẩm</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Tìm theo tên hoặc SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                    />
                    <button
                      onClick={searchProducts}
                      disabled={searching}
                      className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded bg-white divide-y">
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 hover:bg-gray-50 flex justify-between items-center cursor-pointer"
                          onClick={() =>
                            setNewItem({
                              ...newItem,
                              productId: p.id,
                              productName: p.name,
                              flashPrice: p.price_cache * 0.5,
                            })
                          }
                        >
                          <div>
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-xs text-gray-500">
                              {p.sku} - Gốc:{' '}
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(p.price_cache)}
                            </div>
                          </div>
                          {newItem.productId === p.id && (
                            <div className="text-green-600 text-sm font-bold">Đã chọn</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {newItem.productId > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">
                          Giá Flash Sale (VNĐ)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                          value={newItem.flashPrice}
                          onChange={(e) =>
                            setNewItem({ ...newItem, flashPrice: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">
                          Giới hạn số lượng
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                          value={newItem.quantityLimit}
                          onChange={(e) =>
                            setNewItem({ ...newItem, quantityLimit: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">
                          % Giảm giá (Hiển thị)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                          value={newItem.discountPercentage}
                          onChange={(e) =>
                            setNewItem({ ...newItem, discountPercentage: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-sm text-gray-600"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={addItemToFlashSale}
                      disabled={!newItem.productId}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Xác nhận thêm
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá Flash
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SL/Đã bán
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Xóa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {flashSale.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.product_name}
                          </div>
                          <div className="text-xs text-gray-500">{item.product_sku}</div>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-red-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.flash_price)}
                          <span className="ml-1 text-[10px] text-gray-400 font-normal">
                            (-{item.discount_percentage}%)
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {item.quantity_sold} / {item.quantity_limit}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => deleteItem(item.product_id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {flashSale.items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Chưa có sản phẩm nào trong đợt này
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
