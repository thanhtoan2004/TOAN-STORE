'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  FileText,
  Settings,
  Save,
  RefreshCw,
  Search,
  Globe,
  ExternalLink,
  ShieldCheck,
  Zap,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SEODashboardPage() {
  const [activeTab, setActiveTab] = useState<'robots' | 'sitemap'>('robots');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFile();
  }, [activeTab]);

  const fetchFile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/seo/files?type=${activeTab}`);
      const data = await response.json();
      if (data.success && data.data) {
        setContent(data.data.content || '');
      }
    } catch (error) {
      toast.error('Lỗi khi tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/seo/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, content }),
      });
      if (response.ok) {
        toast.success(`Đã cập nhật ${activeTab === 'robots' ? 'robots.txt' : 'sitemap.xml'}`);
      }
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" />
            Cấu hình SEO & Website
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý cách các công cụ tìm kiếm (Google, Bing) lập chỉ mục website của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Tùy chọn Files
                </h3>
              </div>
              <div className="p-2">
                <button
                  onClick={() => setActiveTab('robots')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'robots'
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="text-sm">Robots.txt</span>
                    <span className="text-[10px] opacity-70">Quy định quyền truy cập crawler</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('sitemap')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'sitemap'
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="text-sm">Sitemap.xml</span>
                    <span className="text-[10px] opacity-70">Sơ đồ đường dẫn website</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg">
              <h4 className="font-bold flex items-center gap-2 text-sm mb-2">
                <FileText className="w-4 h-4" /> SEO Tips
              </h4>
              <p className="text-xs text-blue-100 leading-relaxed mb-4">
                Việc cấu hình <strong>Sitemap</strong> chính xác giúp Google tìm thấy các sản phẩm
                mới nhanh hơn gấp 2 lần.
              </p>
              <a
                href={`/${activeTab === 'robots' ? 'robots.txt' : 'sitemap.xml'}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
              >
                Xem trực tiếp <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Editor */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Editor: {activeTab === 'robots' ? 'robots.txt' : 'sitemap.xml'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchFile()}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                    title="Làm mới"
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || saving}
                    className="px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-all"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Lưu thay đổi
                  </button>
                </div>
              </div>

              <div className="flex-1 relative">
                {loading ? (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                  </div>
                ) : null}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  spellCheck={false}
                  className="w-full h-full p-6 text-sm font-mono text-gray-800 bg-gray-50/50 outline-none resize-none leading-relaxed"
                  placeholder={
                    activeTab === 'robots'
                      ? 'Enter robots.txt rules...'
                      : 'Enter sitemap.xml tags...'
                  }
                />
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold">
                  UTF-8 Encoding
                </span>
                <span className="text-[10px] text-gray-400 uppercase font-bold">
                  {content?.length || 0} Characters
                </span>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3">
              <div className="text-yellow-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xs text-yellow-800 leading-relaxed">
                <strong>Cẩn trọng:</strong> Sửa robots.txt sai có thể khiến toàn bộ website biến mất
                khỏi kết quả tìm kiếm Google. Hãy chắc chắn bạn biết mình đang cấu hình điều gì.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
