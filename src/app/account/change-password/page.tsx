'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Info } from 'lucide-react';

export default function ChangePassword() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  // Clear form when user logs out
  useEffect(() => {
    if (!user) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setMessage('');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate
    if (formData.newPassword.length < 6) {
      setMessage('Mật khẩu mới phải có ít nhất 6 ký tự');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Đổi mật khẩu thành công!');
        setMessageType('success');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          router.push('/account/settings');
        }, 2000);
      } else {
        setMessage(data.message || 'Có lỗi xảy ra');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Không thể kết nối đến server');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-6">
            <Link href="/account/settings" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
              ← Quay lại cài đặt
            </Link>
            <h1 className="text-3xl font-bold mb-2">Đổi mật khẩu</h1>
            <p className="text-gray-600">Cập nhật mật khẩu của bạn để bảo mật tài khoản</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Mật khẩu hiện tại *</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mật khẩu mới *</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu mới *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2 text-blue-900">
                  <Info className="w-5 h-5" />
                  <h3 className="font-medium">Lưu ý bảo mật</h3>
                </div>
                <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside ml-1">
                  <li>Mật khẩu nên có ít nhất 6 ký tự</li>
                  <li>Kết hợp chữ hoa, chữ thường và số</li>
                  <li>Không sử dụng mật khẩu dễ đoán</li>
                  <li>Không chia sẻ mật khẩu với người khác</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 rounded-full font-medium transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
                <Link href="/account/settings" className="flex-1">
                  <button
                    type="button"
                    className="w-full py-3 rounded-full font-medium border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    Hủy
                  </button>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
