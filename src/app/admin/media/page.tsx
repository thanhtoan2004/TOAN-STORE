'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Upload,
  Search,
  Trash2,
  Image as ImageIcon,
  Grid,
  List,
  Folder,
  MoreVertical,
  CheckCircle2,
  Loader2,
  Filter,
  RefreshCw,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface MediaItem {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  altText: string | null;
  folder: string;
  createdAt: string;
}

export default function MediaManagerPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [mediaStats, setMediaStats] = useState({ totalSize: 0, totalFiles: 0 });

  useEffect(() => {
    fetchMedia();
  }, [page, selectedFolder]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24',
      });
      if (selectedFolder !== 'all') params.append('folder', selectedFolder);
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/media?${params}`);
      const data = await response.json();
      if (data.success) {
        setMedia(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
        if (data.metadata?.stats) {
          setMediaStats(data.metadata.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Lỗi khi tải thư viện ảnh');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', selectedFolder !== 'all' ? selectedFolder : 'general');

      try {
        const response = await fetch('/api/admin/media', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          successCount++;
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`Đã tải lên ${successCount} ảnh thành công`);
      fetchMedia();
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteMedia = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;

    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Đã xóa ảnh');
        fetchMedia();
      }
    } catch (error) {
      toast.error('Lỗi khi xóa ảnh');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thư viện Media</h1>
            <p className="text-gray-500 text-sm mt-1">
              Quản lý tập trung tất cả hình ảnh, logo và tệp tin hệ thống
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-sm font-medium">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh mới'}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <button
              onClick={() => fetchMedia()}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              <RefreshCw size={20} className={loading && media?.length > 0 ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Dashboard Stats & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-500" /> Thư mục
              </h3>
              <div className="space-y-1">
                {['all', 'products', 'banners', 'general', 'reviews'].map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedFolder === folder
                        ? 'bg-blue-50 text-blue-600 font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {folder === 'all'
                      ? 'Tất cả media'
                      : folder === 'products'
                        ? 'Sản phẩm'
                        : folder === 'banners'
                          ? 'Banner & QC'
                          : folder === 'reviews'
                            ? 'Đánh giá'
                            : 'Chung'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tổng dung lượng</h3>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (mediaStats.totalSize / (10 * 1024 * 1024 * 1024)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Đã sử dụng {formatFileSize(mediaStats.totalSize)} / 10 GB
              </p>
            </div>
          </div>

          {/* Media Content */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm tệp tin..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchMedia()}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {loading && (!media || media.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-dashed border-gray-200">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500">Đang đồng bộ hóa thư viện...</p>
              </div>
            ) : !media || media.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-dashed border-gray-200">
                <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">Không tìm thấy tệp tin nào</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="aspect-square relative flex items-center justify-center bg-gray-50 overflow-hidden">
                      <Image
                        src={item.filePath}
                        alt={item.fileName}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100">
                          <MoreVertical size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(item.id)}
                          className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p
                        className="text-xs font-medium text-gray-900 truncate"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase">
                        {item.mimeType.split('/')[1]} • {formatFileSize(item.fileSize)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Tên tệp</th>
                      <th className="px-6 py-3 font-semibold">Thư mục</th>
                      <th className="px-6 py-3 font-semibold">Dung lượng</th>
                      <th className="px-6 py-3 font-semibold">Ngày tạo</th>
                      <th className="px-6 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {media.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 relative rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                              <Image src={item.filePath} alt="" fill className="object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                {item.fileName}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {item.width} x {item.height} px
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase">
                            {item.folder}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {formatFileSize(item.fileSize)}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteMedia(item.id)}
                            className="text-red-400 hover:text-red-600 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
