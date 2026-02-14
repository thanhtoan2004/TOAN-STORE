'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateTime, formatCurrency } from '@/lib/date-utils';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';

interface RefundRequest {
    id: number;
    order_id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    order_number: string;
    amount: number;
    reason: string;
    images: string; // JSON string
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    created_at: string;
    admin_response?: string;
}

export default function AdminRefundsPage() {
    const [refunds, setRefunds] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const query = filterStatus ? `?status=${filterStatus}` : '';
            const res = await fetch(`/api/admin/refunds${query}`);
            const data = await res.json();
            setRefunds(data.refunds || []);
        } catch (error) {
            console.error(error);
            toast.error('Lỗi tải danh sách hoàn tiền');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, [filterStatus]);

    const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
        if (!confirm(`Bạn có chắc muốn ${status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'} yêu cầu này?`)) return;

        try {
            setProcessingId(id);
            const res = await fetch(`/api/admin/refunds/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    response: status === 'approved' ? 'Yêu cầu hoàn tiền đã được chấp nhận.' : 'Yêu cầu hoàn tiền bị từ chối.'
                })
            });

            if (res.ok) {
                toast.success('Cập nhật thành công');
                fetchRefunds();
            } else {
                toast.error('Cập nhật thất bại');
            }
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Chờ xử lý</span>;
            case 'approved': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Đã duyệt</span>;
            case 'rejected': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Từ chối</span>;
            default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>;
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Quản lý Yêu cầu Hoàn tiền / Trả hàng</h1>
                    <div className="flex gap-2">
                        <select
                            className="border rounded-md px-3 py-2"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending">Chờ xử lý</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Đã từ chối</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Ngày tạo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý do & Ảnh</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-4">Đang tải...</td></tr>
                            ) : refunds.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-4 text-gray-500">Không có yêu cầu nào.</td></tr>
                            ) : (
                                refunds.map((refund) => (
                                    <tr key={refund.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            #{refund.id}
                                            <div className="text-xs text-gray-400">{formatDateTime(refund.created_at)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{refund.user_name}</div>
                                            <div className="text-sm text-gray-500">{refund.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                            <Link href={`/admin/orders/${refund.order_id}`} target="_blank">
                                                #{refund.order_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900 line-clamp-2" title={refund.reason}>{refund.reason}</p>
                                            <div className="flex gap-1 mt-1">
                                                {(() => {
                                                    try {
                                                        const rawImages = refund.images;
                                                        const images = Array.isArray(rawImages)
                                                            ? rawImages
                                                            : JSON.parse(rawImages || '[]');

                                                        return images.map((img: string, idx: number) => (
                                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                                                                <div className="relative w-8 h-8 rounded border overflow-hidden">
                                                                    <Image src={img} alt="Evidence" fill className="object-cover" />
                                                                </div>
                                                            </a>
                                                        ));
                                                    } catch { return null; }
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {formatCurrency(refund.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(refund.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {refund.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/admin/refunds/${refund.id}`}>
                                                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                                            Xem chi tiết
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        disabled={processingId === refund.id}
                                                        onClick={() => handleUpdateStatus(refund.id, 'approved')}
                                                    >
                                                        Duyệt
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                        disabled={processingId === refund.id}
                                                        onClick={() => handleUpdateStatus(refund.id, 'rejected')}
                                                    >
                                                        Từ chối
                                                    </Button>
                                                </div>
                                            )}
                                            {refund.status !== 'pending' && (
                                                <Link href={`/admin/refunds/${refund.id}`}>
                                                    <Button size="sm" variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50">
                                                        Xem chi tiết
                                                    </Button>
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
