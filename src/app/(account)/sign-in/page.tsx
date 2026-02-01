'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
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
  const { login } = useAuth();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage(t.auth.created_account);
    }

    // Load saved email if exists
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await login(email, password);

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // If login succeeds, redirect to home
      router.push('/');
    } catch (err: unknown) {
      // Display the actual error message from API
      const errorMessage = err instanceof Error ? err.message : t.auth.login_error;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nike-container py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase mb-2">{t.auth.sign_in}</h1>
          <p className="text-sm text-gray-500">
            {t.auth.sign_in_desc}
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
              placeholder={t.footer.email_placeholder || "name@example.com"}
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
              "w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-helvetica-medium",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoading ? t.auth.loading : t.common.login}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t.auth.no_account}{" "}
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
    <Suspense fallback={<div className="nike-container py-10">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}


