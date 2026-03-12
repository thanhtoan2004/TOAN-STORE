'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

function SignInContent() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (searchParams?.get('registered') === 'true') {
      setSuccessMessage(t.auth.created_account);
    }

    // Load saved email if exists
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [searchParams, t]);

  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [authEmail, setAuthEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await login(email, password);

      if (typeof result === 'object' && result.requires2FA) {
        setAuthEmail(result.email);
        setShowOTP(true);
        // Send OTP email automatically
        await fetch('/api/auth/2fa/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: result.email, purpose: 'login' }),
        });
        setSuccessMessage('Mã xác thực 2 bước đã được gửi vào email của bạn.');
        return;
      }

      // If login succeeds without 2FA
      handleSuccessfulLogin();
    } catch (err: any) {
      setError(err.message || t.auth.login_error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, otp }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Xác thực thất bại');

      handleSuccessfulLogin();
    } catch (err: any) {
      setError(err.message || 'Mã xác thực không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulLogin = () => {
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    // Hard refresh to update auth state across app
    window.location.href = '/';
  };

  return (
    <div className="toan-container py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase mb-2">{t.auth.sign_in}</h1>
          <p className="text-sm text-gray-500">{t.auth.sign_in_desc}</p>
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

        {showOTP ? (
          <form onSubmit={handleVerifyOTP}>
            <div className="mb-6">
              <label htmlFor="otp" className="block text-sm font-helvetica-medium mb-2 text-center">
                Mã xác thực 6 số
              </label>
              <p className="text-sm text-gray-500 text-center mb-4">
                Vui lòng kiểm tra email của bạn để lấy mã xác thực.
              </p>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full p-4 border rounded-lg text-center text-2xl tracking-[0.5em] font-medium focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="000000"
                required
                minLength={6}
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className={cn(
                'w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-helvetica-medium mb-4',
                (isLoading || otp.length !== 6) && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isLoading ? t.auth.loading : 'Xác nhận OTP'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOTP(false);
                setOtp('');
                setError('');
                setSuccessMessage('');
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-black underline"
            >
              Quay lại đăng nhập bằng mật khẩu
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-helvetica-medium mb-1">
                {t.common.email}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={t.footer.email_placeholder || 'name@example.com'}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-helvetica-medium mb-1">
                {t.common.password}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={t.auth.password}
                required
                minLength={6}
              />
            </div>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 border border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                {t.auth.remember_me}
              </label>
              <Link href="/forgot-password" className="ml-auto text-sm text-black hover:underline">
                {t.auth.forgot_password}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-helvetica-medium mb-4',
                isLoading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isLoading ? t.auth.loading : t.common.login}
            </button>
          </form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 uppercase">Hoặc</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/api/auth/google"
            className="flex items-center justify-center w-full p-3 border rounded hover:bg-gray-50 transition-colors font-helvetica-medium"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
              />
            </svg>
            Tiếp tục với Google
          </Link>

          <Link
            href="/api/auth/facebook"
            className="flex items-center justify-center w-full p-3 border rounded hover:bg-gray-50 transition-colors font-helvetica-medium"
          >
            <svg className="w-5 h-5 mr-3 text-[#1877F2] fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Tiếp tục với Facebook
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t.auth.no_account}{' '}
            <Link href="/sign-up" className="text-black font-helvetica-medium hover:underline">
              {t.common.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="toan-container py-10">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
