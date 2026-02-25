'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SignupPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await register({
        email,
        password,
        firstName,
        lastName,
        dateOfBirth,
        gender
      });

      if (success) {
        router.push('/sign-in?registered=true');
      } else {
        setError(t.auth.register_error);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t.auth.register_error;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nike-container py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase mb-2">{t.auth.create_account}</h1>
          <p className="text-sm text-gray-500">
            {t.auth.sign_up_desc}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-helvetica-medium mb-1">
                {t.common.first_name}
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-helvetica-medium mb-1">
                {t.common.last_name}
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>

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
              placeholder={t.common.password}
              required
              minLength={6}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="dob" className="block text-sm font-helvetica-medium mb-1">
              {t.common.dob}
            </label>
            <input
              type="date"
              id="dob"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-helvetica-medium mb-1">
              {t.common.gender}
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={() => setGender('male')}
                  className="mr-2"
                  required
                />
                {t.common.male}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={() => setGender('female')}
                  className="mr-2"
                />
                {t.common.female}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={gender === 'other'}
                  onChange={() => setGender('other')}
                  className="mr-2"
                />
                {t.common.other}
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 border border-gray-300 rounded"
                required
              />
              <span className="ml-2 text-xs text-gray-600">
                {t.auth.agree_prefix} <Link href="/terms" className="underline">{t.footer.terms_use}</Link> {t.auth.and}
                <Link href="/privacy" className="underline"> {t.footer.privacy}</Link> {t.auth.agree_suffix}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-helvetica-medium mb-4",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoading ? t.auth.loading : t.common.register}
          </button>
        </form>

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
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
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
            {t.auth.already_member}{" "}
            <Link href="/sign-in" className="text-black font-helvetica-medium hover:underline">
              {t.common.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}



