'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Voucher {
    id: number;
    code: string;
    value: number;
    discount_type: 'fixed' | 'percent';
    description: string;
    valid_from: string;
    valid_until: string | null;
    points_required: number;
}

export default function RedeemPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [currentPoints, setCurrentPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        try {
            const response = await fetch('/api/user/redeem');
            const data = await response.json();

            if (data.success) {
                setCurrentPoints(data.data.currentPoints);
                setVouchers(data.data.vouchers);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (voucherId: number, pointsRequired: number) => {
        if (currentPoints < pointsRequired) {
            setMessage({ type: 'error', text: 'Bạn không đủ điểm để đổi voucher này!' });
            return;
        }

        if (!confirm(`Bạn có chắc muốn đổi ${pointsRequired} điểm lấy voucher này?`)) return;

        setRedeeming(voucherId);
        setMessage(null);

        try {
            const response = await fetch('/api/user/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voucherId })
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setCurrentPoints(data.data.remainingPoints);
                // Remove redeemed voucher from list
                setVouchers(prev => prev.filter(v => v.id !== voucherId));
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra, vui lòng thử lại!' });
        } finally {
            setRedeeming(null);
        }
    };

    const formatValue = (voucher: Voucher) => {
        if (voucher.discount_type === 'percent') {
            return `Giảm ${voucher.value}%`;
        }
        return `Giảm ${Number(voucher.value).toLocaleString('vi-VN')}₫`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-10">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/account/settings" className="text-gray-500 hover:text-black text-sm mb-4 inline-block">
                        ← Quay lại Tài khoản
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Đổi Điểm Thưởng</h1>
                    <p className="mt-2 text-gray-600">
                        Sử dụng điểm tích lũy để đổi lấy voucher giảm giá
                    </p>
                </div>

                {/* Points Card */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-300 uppercase tracking-wider">Điểm hiện có</p>
                            <p className="text-4xl font-bold mt-1">{currentPoints.toLocaleString('vi-VN')}</p>
                            <p className="text-sm text-gray-400 mt-1">điểm thưởng</p>
                        </div>
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Voucher Grid */}
                {vouchers.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <p className="text-gray-500 text-lg">Hiện chưa có voucher nào để đổi</p>
                        <p className="text-gray-400 text-sm mt-1">Vui lòng quay lại sau!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vouchers.map((voucher) => {
                            const canAfford = currentPoints >= voucher.points_required;
                            const isRedeeming = redeeming === voucher.id;

                            return (
                                <div
                                    key={voucher.id}
                                    className={`bg-white rounded-xl shadow-sm border-2 transition-all overflow-hidden ${canAfford
                                            ? 'border-transparent hover:border-black hover:shadow-md'
                                            : 'border-transparent opacity-60'
                                        }`}
                                >
                                    {/* Voucher Value Header */}
                                    <div className={`px-6 py-4 ${voucher.discount_type === 'percent'
                                            ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                                            : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                                        } text-white`}>
                                        <p className="text-2xl font-bold">{formatValue(voucher)}</p>
                                        <p className="text-sm opacity-80 mt-1">Mã: {voucher.code}</p>
                                    </div>

                                    <div className="p-6">
                                        {/* Description */}
                                        {voucher.description && (
                                            <p className="text-gray-600 text-sm mb-4">{voucher.description}</p>
                                        )}

                                        {/* Expiry */}
                                        {voucher.valid_until && (
                                            <p className="text-xs text-gray-400 mb-4">
                                                HSD: {new Date(voucher.valid_until).toLocaleDateString('vi-VN')}
                                            </p>
                                        )}

                                        {/* Points & Action */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">Cần</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {voucher.points_required.toLocaleString('vi-VN')} <span className="text-sm font-normal">điểm</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRedeem(voucher.id, voucher.points_required)}
                                                disabled={!canAfford || isRedeeming}
                                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${canAfford
                                                        ? 'bg-black text-white hover:bg-gray-800 active:scale-95'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isRedeeming ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                        Đang xử lý...
                                                    </span>
                                                ) : canAfford ? (
                                                    'Đổi ngay'
                                                ) : (
                                                    'Không đủ điểm'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-10 bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin về đổi điểm</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            Voucher sau khi đổi sẽ xuất hiện trong mục &quot;Voucher của tôi&quot;
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            Điểm sẽ được trừ ngay khi đổi thành công
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            Mỗi voucher chỉ được đổi một lần. Không hoàn lại điểm
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
