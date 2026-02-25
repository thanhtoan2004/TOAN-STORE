'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.');
                setEmail('');
            } else {
                setError(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="nike-container py-10">
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold uppercase mb-2">Quên mật khẩu?</h1>
                    <p className="text-sm text-gray-500">
                        Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
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
                    <div className="mb-6">
                        <label htmlFor="email" className="block text-sm font-helvetica-medium mb-1">
                            Địa chỉ Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="name@example.com"
                            required
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
                        {isLoading ? "Đang gửi..." : "Gửi hướng dẫn"}
                    </button>

                    <div className="text-center">
                        <Link href="/sign-in" className="text-sm text-black hover:underline">
                            ← Quay lại đăng nhập
                        </Link>
                    </div>
                </form>

                <div className="mt-6 p-4 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 mb-2 text-gray-700">
                        <Info className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium text-sm">Lưu ý:</h3>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside ml-1">
                        <li>Kiểm tra cả hộp thư spam/junk nếu không thấy email</li>
                        <li>Link đặt lại mật khẩu có hiệu lực trong 1 giờ</li>
                        <li>Liên hệ hỗ trợ nếu bạn không nhận được email</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
