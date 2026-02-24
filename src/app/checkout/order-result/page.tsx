
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Validation wrapper
function OrderResultContent() {
    const searchParams = useSearchParams();
    const status = searchParams?.get('status');
    const orderId = searchParams?.get('orderId');
    const code = searchParams?.get('code');

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Artificial delay or verification logic if needed
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const renderContent = () => {
        if (status === 'success') {
            return (
                <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Thanh toán thành công!</h1>
                    <p className="text-gray-600 mb-6">Cảm ơn bạn đã mua hàng. Đơn hàng #{orderId} của bạn đã được thanh toán.</p>
                    <div className="space-x-4">
                        <Link href={`/orders/${orderId}`}>
                            <Button>Xem đơn hàng</Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline">Tiếp tục mua sắm</Button>
                        </Link>
                    </div>
                </div>
            );
        }

        if (status === 'failed') {
            return (
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Thanh toán thất bại</h1>
                    <p className="text-gray-600 mb-6">Giao dịch không thành công hoặc bị hủy. Mã lỗi: {code || 'N/A'}</p>
                    <div className="space-x-4">
                        {orderId && (
                            <Link href={`/checkout/retry?orderId=${orderId}`}>
                                <Button>Thử lại</Button>
                            </Link>
                        )}
                        <Link href="/checkout">
                            <Button variant="outline">Quay lại thanh toán</Button>
                        </Link>
                    </div>
                </div>
            );
        }

        if (status === 'checksum_failed') {
            return (
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Lỗi xác thực!</h1>
                    <p className="text-gray-600 mb-6">Dữ liệu thanh toán không hợp lệ (Checksum failed). Vui lòng liên hệ CSKH.</p>
                    <Link href="/">
                        <Button variant="outline">Về trang chủ</Button>
                    </Link>
                </div>
            );
        }

        return (
            <div className="text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Kết quả không xác định</h1>
                <p className="text-gray-600 mb-6">Không tìm thấy thông tin giao dịch.</p>
                <Link href="/">
                    <Button>Về trang chủ</Button>
                </Link>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                {renderContent()}
            </div>
        </div>
    );
}

export default function OrderResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <OrderResultContent />
        </Suspense>
    )
}
