'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import ReviewMediaUpload from '../reviews/ReviewMediaUpload';

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: number;
    orderNumber: string;
    items: any[];
    onSuccess: () => void;
}

export default function RefundModal({ isOpen, onClose, orderId, orderNumber, items, onSuccess }: RefundModalProps) {
    const [reason, setReason] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Calculate max refundable amount (simplified: total of items)
    const maxAmount = items.reduce((sum, item) => sum + (item.total_price || 0), 0);

    // Set default amount to max initially
    React.useEffect(() => {
        if (isOpen) {
            setAmount(maxAmount);
        }
    }, [isOpen, maxAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim()) {
            toast.error('Vui lòng nhập lý do hoàn tiền');
            return;
        }

        try {
            setSubmitting(true);
            const uploadedMedia: { url: string; type: 'image' | 'video' }[] = [];

            // 1. Upload media if any
            if (mediaFiles.length > 0) {
                const uploadPromises = mediaFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);

                    const res = await fetch('/api/reviews/upload', { // Reuse upload API
                        method: 'POST',
                        body: formData
                    });

                    if (!res.ok) throw new Error(`Lỗi upload ảnh: ${file.name}`);

                    const data = await res.json();
                    if (data.success && data.data) {
                        return { url: data.data.url, type: data.data.type };
                    }
                    return null;
                });

                const results = await Promise.all(uploadPromises);
                results.forEach(item => {
                    if (item) uploadedMedia.push(item);
                });
            }

            // 2. Submit Refund Request
            const res = await fetch('/api/refunds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    amount,
                    reason,
                    images: uploadedMedia
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Có lỗi xảy ra');
            }

            toast.success('Gửi yêu cầu hoàn tiền thành công!');
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto z-50 animate-slide-up">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-xl font-bold">Yêu cầu Hoàn tiền / Trả hàng</Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-black">
                                <X className="w-6 h-6" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                            <p className="font-medium">Đơn hàng: #{orderNumber}</p>
                            <p className="text-gray-600">Sản phẩm: {items.length} món</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Số tiền muốn hoàn (tối đa: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxAmount)})</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full border rounded-lg p-2"
                                max={maxAmount}
                                min={0}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Lý do *</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border rounded-lg p-2 h-24"
                                placeholder="Vui lòng mô tả chi tiết lý do (Sản phẩm lỗi, sai màu, ...)"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Hình ảnh minh chứng</label>
                            <ReviewMediaUpload
                                onMediaChange={setMediaFiles}
                                maxImages={3}
                                maxVideos={1}
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                                Hủy bỏ
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-black text-white hover:bg-gray-800">
                                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </Button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
