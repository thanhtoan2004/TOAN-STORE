'use client';

import { useEffect, useState, use } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDateTime, formatCurrency } from '@/lib/date-utils';
import { toast } from 'react-hot-toast';

interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    size: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface ShipmentItem {
    id: number;
    shipment_id: number;
    order_item_id: number;
    quantity: number;
    product_name: string;
    sku: string;
}

interface Shipment {
    id: number;
    tracking_code: string;
    carrier: string;
    status: string;
    created_at: string;
    shipped_at: string | null;
    items: ShipmentItem[];
}

interface OrderDetail {
    id: number;
    order_number: string;
    status: string;
    total: number;
    placed_at: string;
    customer_name: string;
    customer_email: string;
    delivery_name: string;
    delivery_phone: string;
    delivery_address: string;
    delivery_city: string;
    delivery_district: string;
    items: OrderItem[];
    shipments: Shipment[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [fulfilling, setFulfilling] = useState(false);

    // Fulfillment form state
    const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
    const [trackingCode, setTrackingCode] = useState('');
    const [carrier, setCarrier] = useState('GHTK');

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const response = await fetch(`/api/admin/orders/${id}`);
            const data = await response.json();
            if (data.success) {
                setOrder(data.data);
                // Initialize fulfillment selections
                const initialSelections: Record<number, number> = {};
                data.data.items.forEach((item: OrderItem) => {
                    const shippedQty = data.data.shipments?.reduce((sum: number, s: Shipment) => {
                        const si = s.items.find(i => i.order_item_id === item.id);
                        return sum + (si?.quantity || 0);
                    }, 0) || 0;
                    const remaining = item.quantity - shippedQty;
                    if (remaining > 0) {
                        initialSelections[item.id] = remaining;
                    }
                });
                setSelectedItems(initialSelections);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleFulfill = async () => {
        const itemsToShip = Object.entries(selectedItems)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => ({ orderItemId: parseInt(id), quantity: qty }));

        if (itemsToShip.length === 0) {
            toast.error('Please select at least one item to ship');
            return;
        }

        setFulfilling(true);
        try {
            const response = await fetch('/api/admin/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order?.id,
                    trackingCode,
                    carrier,
                    items: itemsToShip
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Shipment created successfully');
                fetchOrderDetails();
                setTrackingCode('');
            } else {
                toast.error(data.message || 'Failed to create shipment');
            }
        } catch (error) {
            console.error('Fulfillment error:', error);
            toast.error('Internal server error');
        } finally {
            setFulfilling(false);
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

    if (!order) {
        return (
            <AdminLayout>
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold">Order Not Found</h2>
                    <a href="/admin/orders" className="text-blue-600 hover:underline mt-4 inline-block">Back to Orders</a>
                </div>
            </AdminLayout>
        );
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AdminLayout>
            <div className="space-y-6 pb-12">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <nav className="text-sm font-medium text-gray-500 mb-2">
                            <a href="/admin/orders" className="hover:text-gray-700">Orders</a> / #{order.order_number}
                        </nav>
                        <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
                        <div className="mt-2 flex items-center space-x-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">Placed on {formatDateTime(order.placed_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-semibold text-gray-800">Order Items</h2>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Size</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {order.items.map((item) => {
                                        const shippedQty = order.shipments?.reduce((sum, s) => {
                                            const si = s.items.find(i => i.order_item_id === item.id);
                                            return sum + (si?.quantity || 0);
                                        }, 0) || 0;
                                        const remaining = item.quantity - shippedQty;

                                        return (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-gray-600">{item.size}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="text-sm text-gray-900">{item.quantity}</div>
                                                    {shippedQty > 0 && (
                                                        <div className="text-xs text-green-600">{shippedQty} shipped</div>
                                                    )}
                                                    {remaining > 0 && shippedQty > 0 && (
                                                        <div className="text-xs text-orange-600">{remaining} remaining</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                                    {formatCurrency(item.total_price)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Fulfilment Card */}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="font-semibold text-gray-800">Create Shipment</h2>
                                    <p className="text-xs text-gray-500">Select items to fulfill</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Carrier</label>
                                            <select
                                                value={carrier}
                                                onChange={(e) => setCarrier(e.target.value)}
                                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                            >
                                                <option value="GHTK">Giao Hàng Tiết Kiệm</option>
                                                <option value="GHN">Giao Hàng Nhanh</option>
                                                <option value="VietnamPost">Vietnam Post</option>
                                                <option value="Manual">Manual / Internal</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Tracking Code</label>
                                            <input
                                                type="text"
                                                value={trackingCode}
                                                onChange={(e) => setTrackingCode(e.target.value)}
                                                placeholder="TRK123456789"
                                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                            />
                                        </div>
                                    </div>

                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Item</th>
                                                    <th className="px-4 py-2 text-center w-24">Ship Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {order.items.map(item => {
                                                    const shippedQty = order.shipments?.reduce((sum, s) => {
                                                        const si = s.items.find(i => i.order_item_id === item.id);
                                                        return sum + (si?.quantity || 0);
                                                    }, 0) || 0;
                                                    const remaining = item.quantity - shippedQty;

                                                    if (remaining <= 0) return null;

                                                    return (
                                                        <tr key={`ship-${item.id}`}>
                                                            <td className="px-4 py-3 text-sm">
                                                                {item.product_name} ({item.size})
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={remaining}
                                                                    value={selectedItems[item.id] || 0}
                                                                    onChange={(e) => setSelectedItems({ ...selectedItems, [item.id]: parseInt(e.target.value) || 0 })}
                                                                    className="w-full text-center text-sm border-gray-300 rounded focus:ring-black focus:border-black"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button
                                        onClick={handleFulfill}
                                        disabled={fulfilling}
                                        className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-400"
                                    >
                                        {fulfilling ? 'Creating Shipment...' : 'Create Shipment & Notify Customer'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Shipments History */}
                        {order.shipments && order.shipments.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 px-2">Shipment History</h3>
                                {order.shipments.map((shipment) => (
                                    <div key={shipment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                                            <div className="flex items-center space-x-4">
                                                <div className="font-bold text-gray-900">{shipment.tracking_code}</div>
                                                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase font-bold">{shipment.carrier}</span>
                                            </div>
                                            <span className="text-sm font-medium text-green-600">{shipment.status.toUpperCase()}</span>
                                        </div>
                                        <div className="p-4 bg-white">
                                            <ul className="text-sm text-gray-600 space-y-1">
                                                {shipment.items.map((item, idx) => (
                                                    <li key={idx} className="flex justify-between">
                                                        <span>{item.product_name} ({item.sku})</span>
                                                        <span className="font-medium">x{item.quantity}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                                                Created on {formatDateTime(shipment.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-semibold text-gray-800 mb-4">Customer Details</h2>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                        {order.customer_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">{order.customer_name}</div>
                                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-semibold text-gray-800 mb-4">Shipping Address</h2>
                            <div className="text-sm text-gray-600 space-y-1">
                                <div className="font-bold text-gray-900">{order.delivery_name}</div>
                                <div>{order.delivery_phone}</div>
                                <div className="mt-2">{order.delivery_address}</div>
                                <div>{order.delivery_district}, {order.delivery_city}</div>
                            </div>
                        </div>

                        {/* Order Total Summary */}
                        <div className="bg-black rounded-xl shadow-sm p-6 text-white">
                            <h2 className="font-semibold mb-4 border-b border-gray-800 pb-2">Order Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Shipping</span>
                                    <span>Free</span>
                                </div>
                                <div className="pt-4 flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
