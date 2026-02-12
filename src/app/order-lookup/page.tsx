'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { formatDateTime, formatCurrency } from '@/lib/date-utils';

interface OrderItem {
    id: number;
    product_name: string;
    size: string;
    quantity: number;
    unit_price: number;
    image_url: string | null;
}

interface Order {
    order_number: string;
    placed_at: string;
    status: string;
    subtotal: number;
    shipping_fee: number;
    total: number;
    payment_method: string;
    payment_status: string;
    shipping_address: string | { address: string; ward: string; district: string; city: string; name?: string; phone?: string };
    phone: string;
    items: OrderItem[];
}

export default function OrderLookupPage() {
    const [orderNumber, setOrderNumber] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [order, setOrder] = useState<Order | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber.trim() || !email.trim()) return;

        setIsLoading(true);
        setError('');
        setOrder(null);

        try {
            const response = await fetch('/api/orders/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderNumber, email }),
            });

            const data = await response.json();

            if (response.ok) {
                setOrder(data.order);
            } else {
                setError(data.message || 'Không tìm thấy đơn hàng.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Chờ xử lý';
            case 'confirmed': return 'Đã xác nhận';
            case 'shipped': return 'Đang giao hàng';
            case 'delivered': return 'Đã giao hàng';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="nike-container">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold uppercase mb-2">Tra cứu đơn hàng</h1>
                        <p className="text-gray-600">Kiểm tra tình trạng đơn hàng của bạn</p>
                    </div>

                    {/* Form */}
                    <div className="bg-white p-8 rounded-lg shadow-sm border mb-8">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="orderNumber" className="block text-sm font-medium mb-1">Mã đơn hàng</label>
                                <input
                                    type="text"
                                    id="orderNumber"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    placeholder="VD: NK1701234567"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1">Email đặt hàng</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${isLoading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}`}
                            >
                                {isLoading ? 'Đang kiểm tra...' : 'Tra cứu'}
                            </button>
                        </form>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded border border-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Result */}
                    {order && (
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold">Đơn hàng #{order.order_number}</h2>
                                    <p className="text-sm text-gray-500">Đặt ngày: {formatDateTime(order.placed_at)}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                </span>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Items */}
                                <div>
                                    <h3 className="font-medium mb-3">Sản phẩm</h3>
                                    <div className="space-y-4">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex gap-4">
                                                <div className="relative w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                                                    {item.image_url ? (
                                                        <Image src={item.image_url} alt={item.product_name} fill className="object-cover rounded" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-xs text-gray-400">No img</div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium line-clamp-2">{item.product_name}</p>
                                                    <p className="text-sm text-gray-500">Size: {item.size} | SL: {item.quantity}</p>
                                                    <p className="text-sm font-medium mt-1">{formatCurrency(item.unit_price)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Address */}
                                    <div>
                                        <h3 className="font-medium mb-2">Địa chỉ giao hàng</h3>
                                        <p className="text-sm text-gray-600">
                                            {/* Mask phone number for privacy */}
                                            {order.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}<br />
                                            {/* Parse shipping address if string */}
                                            {(() => {
                                                try {
                                                    const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
                                                    // Check if addr is object
                                                    if (typeof addr === 'object' && addr !== null) {
                                                        return (
                                                            <>
                                                                {addr.address}<br />
                                                                {addr.ward}, {addr.district}<br />
                                                                {addr.city}
                                                            </>
                                                        );
                                                    }
                                                    return String(addr);
                                                } catch {
                                                    return String(order.shipping_address);
                                                }
                                            })()}
                                        </p>
                                    </div>

                                    {/* Summary */}
                                    <div>
                                        <h3 className="font-medium mb-2">Tổng cộng</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Tạm tính:</span>
                                                <span>{formatCurrency(order.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Phí vận chuyển:</span>
                                                <span>{formatCurrency(order.shipping_fee)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                                                <span>Thành tiền:</span>
                                                <span>{formatCurrency(order.total)}</span>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500 text-right">
                                                Phương thức: {order.payment_method.toUpperCase()} <br />
                                                Trạng thái: {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
