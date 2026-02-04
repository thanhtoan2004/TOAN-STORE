'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  variant_id: number;
  variant_size?: string;
  variant_color?: string;
  quantity: number;
  reserved: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);

  // Add inventory modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [newInventory, setNewInventory] = useState({
    product_id: '',
    size: '',
    color: '',
    quantity: 0
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [page, search]);

  useEffect(() => {
    if (showAddModal) {
      fetchProducts();
    }
  }, [showAddModal]);

  const fetchInventory = async () => {
    // ... (keep existing fetchInventory)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setInventory(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products?limit=100'); // Fetch a good amount for selection
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleUpdateQuantity = async (id: number) => {
    // ... (keep existing handleUpdateQuantity)
    try {
      const response = await fetch(`/api/admin/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: editQuantity })
      });

      if (response.ok) {
        setEditingId(null);
        fetchInventory();
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInventory)
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewInventory({ product_id: '', size: '', color: '', quantity: 0 });
        fetchInventory();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Lỗi khi thêm kho');
      }
    } catch (error) {
      console.error('Error adding inventory:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setAdding(false);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Hết hàng</span>;
    } else if (quantity <= 10) {
      return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Cần nhập</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Có sẵn</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Kho hàng</h1>
            <p className="mt-1 text-sm text-gray-500">Theo dõi và cập nhật số lượng sản phẩm</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <span>+ Thêm tồn kho</span>
            </button>
            <div className="text-sm font-medium bg-gray-100 px-4 py-2 rounded-full">
              Total Items: <span className="font-bold">{total}</span>
            </div>
          </div>
        </div>

        {/* ... (rest of search and table) */}
        {/* Tìm kiếm */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, SKU, size..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        {/* Bảng */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8">Đang tải...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biến thể</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đặt trước</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 min-w-[200px]">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.product_sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.variant_size && `Size: ${item.variant_size}`}
                      {item.variant_color && ` | Color: ${item.variant_color}`}
                      {!item.variant_size && !item.variant_color && '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.reserved}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStockStatus(item.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateQuantity(item.id)}
                            className="text-green-600 hover:text-green-900 px-2"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-600 hover:text-gray-900 px-2"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditQuantity(item.quantity);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Cập nhật
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      Không tìm thấy dữ liệu tồn kho.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination ... */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-4 py-2">Trang {page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}

        {/* Add Inventory Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Thêm tồn kho mới</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddInventory} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm *</label>
                  <select
                    required
                    value={newInventory.product_id}
                    onChange={(e) => setNewInventory({ ...newInventory, product_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="">Chọn sản phẩm...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 42, M, ..."
                      value={newInventory.size}
                      onChange={(e) => setNewInventory({ ...newInventory, size: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                    <input
                      type="text"
                      placeholder="Trắng, Đen..."
                      value={newInventory.color}
                      onChange={(e) => setNewInventory({ ...newInventory, color: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newInventory.quantity}
                    onChange={(e) => setNewInventory({ ...newInventory, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                  >
                    {adding ? 'Đang thêm...' : 'Xác nhận'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
