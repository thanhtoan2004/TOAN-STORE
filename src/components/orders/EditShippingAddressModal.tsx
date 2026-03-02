'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";

const shippingSchema = z.object({
    name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    phone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"),
    address: z.string().min(5, "Địa chỉ quá ngắn"),
    city: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),
    district: z.string().min(1, "Vui lòng nhập Quận/Huyện"),
    ward: z.string().min(1, "Vui lòng nhập Phường/Xã"),
});

interface EditShippingAddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderNumber: string;
    currentAddress: {
        name: string;
        phone: string;
        address: string;
        city: string;
        district: string;
        ward: string;
    };
    onSuccess: () => void;
}

export default function EditShippingAddressModal({
    isOpen,
    onClose,
    orderNumber,
    currentAddress,
    onSuccess
}: EditShippingAddressModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof shippingSchema>>({
        resolver: zodResolver(shippingSchema),
        defaultValues: {
            name: currentAddress.name || '',
            phone: currentAddress.phone || '',
            address: currentAddress.address || '',
            city: currentAddress.city || 'TP. Hồ Chí Minh',
            district: currentAddress.district || '',
            ward: currentAddress.ward || ''
        }
    });

    if (!isOpen) return null;

    const onSubmit = async (values: z.infer<typeof shippingSchema>) => {
        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/orders/${orderNumber}/shipping`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });

            const result = await response.json();

            if (result.success) {
                alert('Cập nhật địa chỉ nhận hàng thành công!');
                onSuccess();
                onClose();
            } else {
                alert(result.message || 'Lỗi khi cập nhật địa chỉ');
            }
        } catch (error) {
            console.error('Lỗi khi submit form cập nhật địa chỉ:', error);
            alert('Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-helvetica-medium text-lg">Cập nhật địa chỉ nhận hàng</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Người nhận *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nguyễn Văn A" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Số điện thoại *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0901234567" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số nhà, Tên đường *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số 1, Đường Lê Duẩn..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tỉnh/Thành phố *</FormLabel>
                                            <FormControl>
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    {...field}
                                                >
                                                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                                    <option value="Hà Nội">Hà Nội</option>
                                                    <option value="Đà Nẵng">Đà Nẵng</option>
                                                    <option value="Cần Thơ">Cần Thơ</option>
                                                    <option value="Hải Phòng">Hải Phòng</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="district"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quận/Huyện *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Quận/Huyện" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ward"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phường/Xã *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Phường/Xã" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 flex-wrap">
                                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                    Hủy bỏ
                                </Button>
                                <Button type="submit" className="bg-black text-white" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu địa chỉ'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
