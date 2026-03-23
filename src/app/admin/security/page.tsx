'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'react-hot-toast';

export default function AdminSecurityPage() {
  const [setupData, setSetupData] = useState<{
    qrCode: string;
    secret: string;
    uri: string;
  } | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [current2FA, setCurrent2FA] = useState<{ enabled: boolean; type: string } | null>(null);

  useEffect(() => {
    fetchCurrent2FAStatus();
  }, []);

  const fetchCurrent2FAStatus = async () => {
    try {
      const res = await fetch('/api/admin/staff/me'); // I should create this endpoint or use logic to get my info
      const data = await res.json();
      if (data.success) {
        setCurrent2FA({
          enabled: data.data.twoFactorEnabled === 1,
          type: data.data.twoFactorType,
        });
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    }
  };

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/2fa/setup');
      const data = await res.json();
      if (data.success) {
        setSetupData(data.data);
      } else {
        toast.error(data.message || 'Lỗi khi bắt đầu thiết lập');
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async () => {
    if (!token || token.length !== 6) {
      toast.error('Vui lòng nhập mã 6 chữ số');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSetupData(null);
        setToken('');
        fetchCurrent2FAStatus();
      } else {
        toast.error(data.message || 'Xác thực thất bại');
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-helvetica-bold">
            BẢO MẬT TÀI KHOẢN
          </h1>
          <p className="text-gray-500 mt-2">
            Quản lý các phương thức xác thực và bảo mật cho tài khoản quản trị của bạn.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                Xác thực 2 lớp (2FA)
              </h2>
              <p className="text-sm text-gray-500 max-w-md">
                Tăng cường bảo mật bằng cách yêu cầu mã xác thực từ điện thoại của bạn mỗi khi đăng
                nhập.
              </p>
            </div>
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${current2FA?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {current2FA?.enabled ? `Đang bật (${current2FA.type})` : 'Đang tắt'}
            </div>
          </div>

          {!setupData ? (
            <div className="mt-8 border-t pt-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div
                  className="p-6 border rounded-xl hover:border-black transition-colors cursor-pointer group"
                  onClick={handleStartSetup}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                        <path d="M12 18h.01" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">Google Authenticator / Authy</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Sử dụng ứng dụng trên điện thoại để quét mã QR và lấy mã OTP. An toàn hơn Email.
                  </p>
                  <button className="mt-6 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    {current2FA?.type === 'totp' ? 'Cài đặt lại' : 'Thiết lập ngay'}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 border rounded-xl opacity-50 cursor-not-allowed">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">Email OTP</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Mã xác nhận sẽ được gửi về email đăng ký. Đã được Super Admin thiết lập mặc
                    định.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 border-t pt-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row gap-10 items-center">
                <div className="bg-white p-4 border-4 border-gray-100 rounded-2xl shadow-inner">
                  <img src={setupData.qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold">Quét mã QR để bắt đầu</h3>
                    <p className="text-gray-500 mt-1">
                      Mở ứng dụng Google Authenticator và quét mã QR bên cạnh.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <p className="text-xs text-amber-800 font-bold uppercase mb-1">
                      Mật mã bí mật (Secret Key)
                    </p>
                    <code className="text-sm font-mono break-all">{setupData.secret}</code>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold uppercase">
                      Nhập mã 6 chữ số để xác nhận
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="000 000"
                        maxLength={6}
                        className="flex-1 text-2xl font-mono tracking-widest text-center px-4 py-3 border-2 rounded-xl focus:border-black outline-none transition-all"
                        autoFocus
                      />
                      <button
                        onClick={handleConfirmSetup}
                        disabled={loading || token.length !== 6}
                        className="bg-black text-white px-8 rounded-xl font-bold hover:bg-zinc-800 disabled:bg-gray-200 transition-all"
                      >
                        {loading ? '...' : 'XÁC NHẬN'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setSetupData(null)}
                    className="text-gray-400 text-sm hover:text-red-500 transition-colors"
                  >
                    Hủy thiết lập
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
