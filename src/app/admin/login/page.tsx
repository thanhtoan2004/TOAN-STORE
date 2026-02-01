'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

function AdminLoginContent() {
  const [email, setEmail] = useState('admin@nike.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const success = await login(email, password);

      if (success) {
        // Fetch user data to check if admin
        const userResponse = await fetch('/api/auth/me');
        const userData = await userResponse.json();

        if (userData.is_admin || userData.user?.is_admin) {
          router.push('/admin/dashboard');
        } else {
          setError('Tài khoản này không có quyền truy cập admin');
        }
      } else {
        setError('Email hoặc mật khẩu không chính xác');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi đăng nhập';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nike-container py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase mb-2">ADMIN</h1>
          <p className="text-sm text-gray-500">
            Đăng nhập admin để quản lý trang web.
          </p>
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
            <Link href="/forgot-password" className="ml-auto text-sm text-black hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-helvetica-medium",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
            suppressHydrationWarning
          >
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

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



