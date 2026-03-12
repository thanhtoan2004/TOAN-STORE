'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatCurrency } from '@/lib/utils/date-utils';
import { toast } from 'react-hot-toast';

interface RefundDetail {
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

export default function AdminRefundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [refund, setRefund] = useState<RefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRefundDetail();
  }, [id]);

  const fetchRefundDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/refunds/${id}`); // We might need to adjust API to support single fetch if not exists
      // Since standard GET /api/admin/refunds returns list, we might need to filter or implementing GET /api/admin/refunds/[id]
      // Let's implement GET in [id]/route.ts if missing.

      // For now, assuming GET /api/admin/refunds returns list, let's look at list response or implementation
      // Actually, usually detail page needs specific endpoint.
      // I'll assume I need to ADD GET to src/app/api/admin/refunds/[id]/route.ts first?
      // Wait, I read [id]/route.ts earlier. It ONLY had PUT.
      // So I MUST add GET to [id]/route.ts first.

      // But let's write the UI code assuming the API will be fixed.
      const response = await fetch(`/api/admin/refunds/${id}`);
      const data = await response.json();

      if (data.success) {
        setRefund(data.data);
      } else {
        toast.error(data.message || 'Error fetching refund detail');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load refund detail');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!confirm(`Bạn có chắc muốn ${status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'} yêu cầu này?`))
      return;

    try {
      setProcessing(true);
      const res = await fetch(`/api/admin/refunds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          response:
            status === 'approved'
              ? 'Yêu cầu hoàn tiền đã được chấp nhận.'
              : 'Yêu cầu hoàn tiền bị từ chối.',
        }),
      });

      if (res.ok) {
        toast.success('Cập nhật thành công');
        router.push('/admin/refunds');
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!refund) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold">Không tìm thấy yêu cầu</h2>
          <Link href="/admin/refunds" className="text-blue-600 hover:underline mt-4 inline-block">
            Quay lại
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const images = (() => {
    try {
      const rawImages = refund.images;
      return Array.isArray(rawImages) ? rawImages : JSON.parse(rawImages || '[]');
    } catch {
      return [];
    }
  })();

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin/refunds"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              ← Quay lại danh sách
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết Yêu cầu #{refund.id}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                refund.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : refund.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {refund.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Evidence Images */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Hình ảnh minh chứng</h2>
              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {images.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border"
                    >
                      <Image src={img} alt={`Evidence ${idx + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Không có hình ảnh</p>
              )}
            </div>

            {/* Reason */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Lý do hoàn tiền</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{refund.reason}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-semibold">Khách hàng</label>
                <p className="font-medium">{refund.user_name}</p>
                <p className="text-sm text-gray-500">{refund.user_email}</p>
              </div>
              <hr />
              <div>
                <label className="text-xs text-gray-500 uppercase font-semibold">Đơn hàng</label>
                <Link
                  href={`/admin/orders/${refund.order_id}`}
                  className="block text-blue-600 hover:underline font-medium"
                >
                  #{refund.order_number}
                </Link>
                <p className="text-xs text-gray-500">{formatDateTime(refund.created_at)}</p>
              </div>
              <hr />
              <div>
                <label className="text-xs text-gray-500 uppercase font-semibold">
                  Số tiền hoàn
                </label>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(refund.amount)}</p>
              </div>
            </div>

            {/* Actions */}
            {refund.status === 'pending' && (
              <div className="bg-white rounded-xl shadow-sm border p-6 space-y-3">
                <h2 className="font-semibold text-gray-800">Hành động</h2>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={processing}
                >
                  Duyệt hoàn tiền
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={processing}
                >
                  Từ chối yêu cầu
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
