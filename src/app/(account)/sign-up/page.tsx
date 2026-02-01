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
  const { register } = useAuth();

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
              "w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-helvetica-medium",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoading ? t.auth.loading : t.common.register}
          </button>
        </form>

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



