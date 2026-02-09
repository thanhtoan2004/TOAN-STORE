"use client";
import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";

interface TrackingStep {
    status: string;
    description: string;
    timestamp?: string;
    isCompleted: boolean;
    isCurrent: boolean;
}

interface OrderTrackingProps {
    orderNumber: string;
    status: string;
    trackingNumber?: string;
    carrier?: string;
    shippedAt?: string;
    deliveredAt?: string;
    estimatedDelivery?: string;
}

export default function OrderTracking({
    orderNumber,
    status,
    trackingNumber,
    carrier,
    shippedAt,
    deliveredAt,
    estimatedDelivery
}: OrderTrackingProps) {
    const [trackingSteps, setTrackingSteps] = useState<TrackingStep[]>([]);

    useEffect(() => {
        const steps: TrackingStep[] = [
            {
                status: "pending",
                description: "Đơn hàng đã được đặt",
                timestamp: undefined,
                isCompleted: ["processing", "shipped", "delivered"].includes(status),
                isCurrent: status === "pending"
            },
            {
                status: "processing",
                description: "Đang xử lý đơn hàng",
                timestamp: undefined,
                isCompleted: ["shipped", "delivered"].includes(status),
                isCurrent: status === "processing"
            },
            {
                status: "shipped",
                description: "Đơn hàng đã được giao cho đơn vị vận chuyển",
                timestamp: shippedAt,
                isCompleted: status === "delivered",
                isCurrent: status === "shipped"
            },
            {
                status: "delivered",
                description: "Đã giao hàng thành công",
                timestamp: deliveredAt,
                isCompleted: status === "delivered",
                isCurrent: status === "delivered"
            }
        ];

        setTrackingSteps(steps);
    }, [status, shippedAt, deliveredAt]);

    const getStatusIcon = (step: TrackingStep) => {
        if (step.isCompleted) {
            return <CheckCircle className="w-8 h-8 text-green-600" />;
        } else if (step.isCurrent) {
            return <Clock className="w-8 h-8 text-blue-600 animate-pulse" />;
        } else {
            return <div className="w-8 h-8 rounded-full border-2 border-gray-300" />;
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Theo dõi đơn hàng</h2>

            {/* Order Info */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Mã đơn hàng</p>
                        <p className="font-semibold text-lg">#{orderNumber}</p>
                    </div>
                    {trackingNumber && (
                        <div>
                            <p className="text-sm text-gray-600">Mã vận đơn</p>
                            <p className="font-semibold text-lg">{trackingNumber}</p>
                        </div>
                    )}
                    {carrier && (
                        <div>
                            <p className="text-sm text-gray-600">Đơn vị vận chuyển</p>
                            <p className="font-semibold">{carrier}</p>
                        </div>
                    )}
                    {estimatedDelivery && status !== "delivered" && (
                        <div>
                            <p className="text-sm text-gray-600">Dự kiến giao hàng</p>
                            <p className="font-semibold">{estimatedDelivery}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tracking Timeline */}
            <div className="relative">
                {trackingSteps.map((step, index) => (
                    <div key={step.status} className="flex gap-4 mb-8 last:mb-0">
                        {/* Icon */}
                        <div className="relative flex flex-col items-center">
                            {getStatusIcon(step)}
                            {index < trackingSteps.length - 1 && (
                                <div
                                    className={`w-0.5 h-16 mt-2 ${step.isCompleted ? "bg-green-600" : "bg-gray-300"
                                        }`}
                                />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-8">
                            <h3
                                className={`font-semibold text-lg ${step.isCurrent
                                        ? "text-blue-600"
                                        : step.isCompleted
                                            ? "text-green-600"
                                            : "text-gray-400"
                                    }`}
                            >
                                {step.description}
                            </h3>
                            {step.timestamp && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {formatDate(step.timestamp)}
                                </p>
                            )}
                            {step.isCurrent && !step.timestamp && (
                                <p className="text-sm text-gray-600 mt-1">Đang xử lý...</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tracking Link */}
            {trackingNumber && carrier && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 mb-2">
                        Bạn có thể theo dõi chi tiết hơn tại website của đơn vị vận chuyển
                    </p>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm underline">
                        Xem chi tiết tại {carrier}
                    </button>
                </div>
            )}

            {/* Help Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                    <strong>Cần hỗ trợ?</strong> Liên hệ với chúng tôi qua email:{" "}
                    <a href="mailto:support@nikeclone.com" className="text-blue-600 hover:underline">
                        support@nikeclone.com
                    </a>{" "}
                    hoặc hotline: <span className="font-semibold">1900-xxxx</span>
                </p>
            </div>
        </div>
    );
}
