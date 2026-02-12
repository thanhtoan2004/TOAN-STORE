'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDateTime } from '@/lib/date-utils';

interface WishlistItem {
  id: number;
  name: string;
  sku: string;
  image_url: string;
  wishlist_count: number;
  unique_users: number;
}

interface WishlistContainer {
  id: number;
  user_id: number;
  name: string;
  is_default: number;
  created_at: string;
  item_count: number;
}

export default function AdminWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [wishlists, setWishlists] = useState<WishlistContainer[]>([]);
  const [summary, setSummary] = useState<{ total_wishlists: number; total_wishlist_items: number; total_users_with_wishlist: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWishlistStats();
  }, [page]);

  const fetchWishlistStats = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      const response = await fetch(`/api/admin/wishlist?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data || []);
        setWishlists(data.wishlists || []);
        setSummary(data.summary || null);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching wishlist stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phân tích Wishlist</h1>
          <p className="mt-1 text-sm text-gray-500">Xem sản phẩm được thêm vào wishlist nhiều nhất</p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Tổng wishlist</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_wishlists}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Tổng sản phẩm trong wishlist</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_wishlist_items}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">User có wishlist</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_users_with_wishlist}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              Chưa có sản phẩm nào được thêm vào wishlist (bảng <code>wishlist_items</code> đang trống).
              <div className="text-xs text-gray-400 mt-2">
                Bên dưới vẫn có thể xem danh sách wishlist theo user.
              </div>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Số lần thêm vào wishlist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Người dùng duy nhất
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url || '/placeholder.png'}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">ID: {item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {item.wishlist_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {item.unique_users}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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

        {/* Wishlists per user */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách wishlist (theo user)</h2>
            <p className="text-sm text-gray-500">Dữ liệu lấy từ bảng <code>wishlists</code> và đếm item trong <code>wishlist_items</code></p>
          </div>
          {loading ? (
            <div className="flex justify-center p-8">Đang tải...</div>
          ) : wishlists.length === 0 ? (
            <div className="text-center p-8 text-gray-500">Chưa có wishlist nào</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wishlist ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mặc định</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tạo lúc</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wishlists.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{w.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{w.user_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{w.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{w.is_default === 1 ? 'Có' : 'Không'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {w.item_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(w.created_at)}</td>
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
