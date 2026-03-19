'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/utils';
import { useAuth } from '@/contexts/AuthContext';

function AdminLoginContent() {
  const [email, setEmail] = useState('admin@toanstore.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [adminId, setAdminId] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    if (searchParams?.get('registered') === 'true') {
      setSuccessMessage('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/login-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.data?.requires2FA) {
          setShow2FA(true);
          setAdminId(data.data.adminId);
          setSuccessMessage('Vui lòng nhập mã OTP đã được gửi đến email của bạn.');
        } else {
          setSuccessMessage('Đăng nhập thành công!');
          router.push('/admin/dashboard');
        }
      } else {
        setError(data.error || 'Email hoặc mật khẩu không chính xác');
        if (data.details?.attemptsLeft !== undefined) {
          setError((prev) => `${prev} (Còn ${data.details.attemptsLeft} lần thử trước khi khóa)`);
        }
      }
    } catch (err: unknown) {
      setError('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Xác thực thành công!');
        router.push('/admin/dashboard');
      } else {
        setError(data.message || 'Mã xác thực không đúng');
      }
    } catch (err) {
      setError('Lỗi hệ thống khi xác thực');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="toan-container py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase mb-2">ADMIN</h1>
          <p className="text-sm text-gray-500">Đăng nhập admin để quản lý trang web.</p>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!show2FA ? (
          <form onSubmit={handleSubmit} suppressHydrationWarning>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-helvetica-medium mb-1">
                Địa chỉ Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="admin"
                required
                suppressHydrationWarning
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-helvetica-medium mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Mật khẩu của bạn"
                required
                minLength={6}
                suppressHydrationWarning
              />
            </div>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 border border-gray-300 rounded"
                suppressHydrationWarning
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Lưu thông tin đăng nhập
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-helvetica-medium',
                isLoading && 'opacity-70 cursor-not-allowed'
              )}
              suppressHydrationWarning
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} suppressHydrationWarning>
            <div className="mb-6">
              <label
                htmlFor="otp"
                className="block text-sm font-bold text-center mb-4 uppercase tracking-widest"
              >
                Mã xác thực 2FA
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center text-4xl p-4 border rounded font-mono tracking-[1rem] focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
              <p className="mt-4 text-xs text-center text-gray-500 italic">
                Hãy kiểm tra hòm thư {email}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-bold uppercase',
                isLoading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isLoading ? 'Đang xác thực...' : 'Xác minh OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShow2FA(false);
                setError('');
              }}
              className="w-full mt-4 text-sm text-gray-500 hover:text-black transition-colors"
            >
              Quay lại đăng nhập
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {/* Chưa có tài khoản?{" "}
            <Link href="/join" className="text-black font-helvetica-medium hover:underline">
              Đăng ký
            </Link> */}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
