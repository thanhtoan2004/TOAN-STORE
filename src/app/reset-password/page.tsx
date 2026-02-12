'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Link không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.');
            setTokenValid(false);
        } else {
            setTokenValid(true);
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
                setTimeout(() => {
                    router.push('/sign-in');
                }, 2000);
            } else {
                setError(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    if (tokenValid === false) {
        return (
            <div className="nike-container py-10">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold uppercase mb-2">Link không hợp lệ</h1>
                        <p className="text-sm text-gray-500">
                            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                        </p>
                    </div>
                    <Link
                        href="/forgot-password"
                        className="block w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-helvetica-medium text-center"
                    >
                        Yêu cầu link mới
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="nike-container py-10">
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold uppercase mb-2">Đặt lại mật khẩu</h1>
                    <p className="text-sm text-gray-500">
                        Nhập mật khẩu mới cho tài khoản của bạn
                    </p>
                </div>

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-helvetica-medium mb-1">
                            Mật khẩu mới
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Ít nhất 6 ký tự"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-helvetica-medium mb-1">
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Nhập lại mật khẩu mới"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "w-full bg-black text-white py-3 rounded hover:bg-zinc-800 transition-colors font-helvetica-medium mb-4",
                            isLoading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                    </button>

                    <div className="text-center">
                        <Link href="/sign-in" className="text-sm text-black hover:underline">
                            ← Quay lại đăng nhập
                        </Link>
                    </div>
                </form>

                <div className="mt-6 p-4 bg-gray-50 rounded">
                    <h3 className="font-medium text-sm mb-2">Lưu ý bảo mật:</h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Sử dụng mật khẩu mạnh (chữ hoa, chữ thường, số)</li>
                        <li>• Không sử dụng lại mật khẩu cũ</li>
                        <li>• Không chia sẻ mật khẩu với bất kỳ ai</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="nike-container py-10">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
