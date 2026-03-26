'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Send,
  Users,
  Mail,
  RefreshCw,
  Info,
  Calendar,
  Layout,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Smartphone,
  Monitor,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  subscribedAt: string;
}

export default function NewsletterMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [total, setTotal] = useState(0);
  const [sampleName, setSampleName] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Form state
  const [formData, setFormData] = useState({
    title: 'Khám phá bộ sưu tập mới nhất!',
    subject: 'TOAN Store: Ưu đãi đặc biệt riêng cho {name}!',
    message:
      'Xin chào {name},\n\nChúng tôi vừa cập nhật bộ sưu tập sản phẩm mới với nhiều mẫu mã đa dạng và thời thượng. Hãy ghé thăm website để xem thêm nhé!',
  });

  useEffect(() => {
    fetchSubs();
  }, []);

  const fetchSubs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/newsletter?limit=1');
      const data = await response.json();
      if (data.success) {
        setTotal(data.data?.pagination?.total || data.data?.total || 0);
        // Lấy tên của người đầu tiên để làm mẫu preview
        if (data.data?.data && data.data.data.length > 0) {
          setSampleName(data.data.data[0].name);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Bạn có chắc muốn gửi email này tới ${total} người đăng ký?`)) return;

    try {
      setSending(true);
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Đã xếp hàng gửi tới ${data.data?.recipients || 0} người nhận thành công!`);
      } else {
        toast.error(data.message || 'Lỗi khi gửi email');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg text-white">
                <Mail className="w-6 h-6" />
              </div>
              Newsletter Campaign
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Xây dựng và gửi chiến dịch marketing qua email
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Target Audience
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {total.toLocaleString()} Active Subscribers
                </div>
              </div>
            </div>
            <button
              onClick={fetchSubs}
              className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-black hover:shadow-md transition-all"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column: Editor */}
          <div className="xl:col-span-12 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                {/* Form Section */}
                <div className="lg:w-1/2 p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Layout className="w-5 h-5 text-blue-500" /> Cấu hình Nội dung
                    </h2>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">
                      Editor
                    </span>
                  </div>

                  <form id="newsletter-form" onSubmit={handleSendBroadcast} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 ml-1">
                        Tiêu đề email (Subject)
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Tiêu đề hiển thị trong hộp thư khách"
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 ml-1">
                        Tiêu đề lớn (H1 Content)
                      </label>
                      <div className="relative">
                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Tiêu đề chính giữa email"
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 ml-1">
                        Nội dung tin nhắn
                      </label>
                      <textarea
                        required
                        rows={8}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Viết nội dung email..."
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none leading-relaxed"
                      />
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                        <Info size={12} className="text-blue-500" />
                        Mẹo: Sử dụng{' '}
                        <code className="bg-gray-100 px-1 rounded text-blue-600 font-bold">
                          {'{name}'}
                        </code>{' '}
                        để chèn tên người nhận (nếu có).
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-amber-900">Lưu ý quan trọng</div>
                          <p className="text-xs text-amber-800 opacity-80 leading-relaxed">
                            Email sẽ được gửi tới <strong>{total} người đăng ký</strong>. Hãy kiểm
                            tra kỹ nội dung trước khi nhấn nút.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={sending || total === 0}
                      className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.99] transition-all font-bold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {sending ? 'Đang xử lý...' : 'Gửi Chiến dịch Ngay'}
                    </button>
                  </form>
                </div>

                {/* Preview Section */}
                <div className="lg:w-1/2 p-8 bg-gray-50 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-8">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-gray-400" /> Live Preview
                    </h2>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                      <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                      >
                        <Monitor size={16} />
                      </button>
                      <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                      >
                        <Smartphone size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Email Shell */}
                  <div
                    className={`transition-all duration-500 bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col ${
                      previewMode === 'desktop'
                        ? 'w-full max-w-[500px] h-[650px] rounded-3xl'
                        : 'w-[320px] h-[550px] rounded-[40px] border-[8px] border-gray-900 shadow-black/10'
                    }`}
                  >
                    {/* Email Content Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="p-8 space-y-8">
                        <div className="flex justify-center">
                          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl italic mt-4">
                            N
                          </div>
                        </div>

                        <h1 className="text-2xl font-black text-center text-gray-900 leading-tight">
                          {formData.title || 'Your Title Here'}
                        </h1>

                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {(formData.message || 'Your content will appear here...').replace(
                            /{name}/g,
                            sampleName || 'Khách hàng'
                          )}
                        </div>

                        <div className="pt-8">
                          <button className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-lg">
                            SHOP COLLECTION
                          </button>
                        </div>

                        <div className="pt-12 pb-8 border-t border-gray-100 text-center space-y-4">
                          <div className="text-[10px] text-gray-400 leading-loose">
                            © 2024 Toan Store Marketplace. All rights reserved.
                            <br />
                            You are receiving this because you subscribed via our site.
                          </div>
                          <div className="flex justify-center gap-4 text-[10px] font-bold text-gray-400">
                            <a href="#" className="underline">
                              Unsubscribe
                            </a>
                            <a href="#" className="underline">
                              Privacy Policy
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats & Info cards below */}
          <div className="xl:col-span-4 lg:col-span-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 h-full">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" /> Best Practices
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Unsubscribe Link</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Hệ thống tự động chèn link huỷ đăng ký vào chân trang để đảm bảo tuân thủ luật
                      bảo mật.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Auto-Formatting</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Tin nhắn được tự động chuyển đổi từ text thuần sang định dạng HTML phù hợp với
                      mọi thiết bị.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 lg:col-span-6">
            <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-red-500" /> Recent Campaign History
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Black Friday Mega Sale', date: '28/02/2024', reach: '8 users' },
                      { name: 'Spring Arrival 2024', date: '15/02/2024', reach: '5 users' },
                      { name: 'Lunar New Year Gift', date: '10/02/2024', reach: '5 users' },
                      { name: 'Welcome Aboard', date: '01/02/2024', reach: '2 users' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold truncate pr-4">{item.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{item.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-black tracking-widest uppercase">
                          <Users size={10} /> {item.reach}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:w-1/3 flex flex-col justify-center items-center text-center p-6 bg-red-500 rounded-2xl shadow-xl shadow-red-500/20">
                  <Users className="w-10 h-10 mb-3" />
                  <div className="text-2xl font-black">{total}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-80">
                    Total Reach Potential
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 text-white/5 transform rotate-12 scale-150">
                <Mail size={150} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #eee;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ddd;
        }
      `}</style>
    </AdminLayout>
  );
}
