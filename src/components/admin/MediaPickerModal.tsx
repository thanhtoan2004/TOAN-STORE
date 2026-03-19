'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  X,
  Image as ImageIcon,
  Loader2,
  Upload,
  Folder,
  CheckCircle2,
  Grid,
  List,
} from 'lucide-react';
import Image from 'next/image';

interface MediaItem {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  folder: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  allowMultiple?: boolean;
  initialFolder?: string;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  allowMultiple = false,
  initialFolder = 'all',
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState(initialFolder);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, activeFolder, search]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '40' });
      if (activeFolder !== 'all') params.append('folder', activeFolder);
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/media?${params}`);
      const data = await response.json();
      if (data.success) {
        setMedia(data.data);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', activeFolder !== 'all' ? activeFolder : 'general');

    try {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        fetchMedia();
        // Select newly uploaded file?
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">Chọn Media</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-gray-50 border-r border-gray-100 p-4 space-y-1">
            {['all', 'products', 'banners', 'general'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFolder(f)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeFolder === f
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm ảnh..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Tải ảnh</span>
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : media.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p>Không có tệp nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      onDoubleClick={() => onSelect(item)}
                      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedId === item.id
                          ? 'border-blue-500 ring-2 ring-blue-100 scale-95'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image src={item.filePath} alt="" fill className="object-cover" />
                      {selectedId === item.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Huỷ
              </button>
              <button
                disabled={!selectedId}
                onClick={() => {
                  const m = media.find((x) => x.id === selectedId);
                  if (m) onSelect(m);
                }}
                className="px-8 py-2 text-sm font-bold text-white bg-black hover:bg-gray-900 rounded-xl transition-colors disabled:opacity-50"
              >
                Dùng ảnh này
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
