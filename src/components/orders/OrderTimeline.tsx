import { Check, Truck, Package, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface OrderTimelineProps {
    status: string;
    dates: {
        placed_at: string;
        confirmed_at?: string;
        shipped_at?: string;
        delivered_at?: string;
        cancelled_at?: string;
    };
}

export function OrderTimeline({ status, dates }: OrderTimelineProps) {
    if (status === 'cancelled') {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                    <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-red-800 mb-2">Đơn hàng đã bị hủy</h3>
                <p className="text-red-600">
                    Đơn hàng này đã bị hủy vào lúc {dates.cancelled_at ? format(new Date(dates.cancelled_at), 'HH:mm dd/MM/yyyy', { locale: vi }) : ''}
                </p>
            </div>
        );
    }

    const steps = [
        {
            id: 'pending',
            label: 'Đặt hàng',
            icon: Clock,
            date: dates.placed_at,
            isActive: true, // Always active if order exists
        },
        {
            id: 'confirmed',
            label: 'Đã xác nhận',
            icon: Check,
            date: dates.confirmed_at,
            isActive: ['confirmed', 'processing', 'shipping', 'delivered'].includes(status),
        },
        {
            id: 'shipping',
            label: 'Đang vận chuyển',
            icon: Truck,
            date: dates.shipped_at,
            isActive: ['shipping', 'delivered'].includes(status),
        },
        {
            id: 'delivered',
            label: 'Giao hàng thành công',
            icon: Package,
            date: dates.delivered_at,
            isActive: status === 'delivered',
        },
    ];

    return (
        <div className="w-full py-6">
            <div className="relative flex items-center justify-between w-full">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                <div
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-black transition-all duration-500 -z-10"
                    style={{
                        width: `${((steps.filter(s => s.isActive).length - 1) / (steps.length - 1)) * 100}%`
                    }}
                />

                {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.id} className="flex flex-col items-center bg-white px-2">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                                    step.isActive
                                        ? "bg-black border-black text-white"
                                        : "bg-white border-gray-300 text-gray-300"
                                )}
                            >
                                <Icon size={20} />
                            </div>
                            <div className="mt-2 text-center">
                                <p className={cn(
                                    "text-sm font-medium",
                                    step.isActive ? "text-black" : "text-gray-500"
                                )}>
                                    {step.label}
                                </p>
                                {step.isActive && step.date && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {format(new Date(step.date), 'HH:mm dd/MM', { locale: vi })}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
