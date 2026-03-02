'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

/**
 * Push Notification Manager — Quản lý đăng ký Push Notifications (PWA).
 * Hiển thị banner hỏi user có muốn nhận thông báo không.
 * Sử dụng Notification API + Service Worker.
 */
export default function PushNotificationBanner() {
    const [show, setShow] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Chỉ hiển thị nếu trình duyệt hỗ trợ và chưa từ chối
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const perm = Notification.permission;
            setPermission(perm);

            // Hiện banner nếu chưa hỏi và chưa dismiss trong 7 ngày
            const dismissed = localStorage.getItem('push_notification_dismissed');
            if (perm === 'default' && !dismissed) {
                // Delay hiện banner 5s để không làm phiền
                const timer = setTimeout(() => setShow(true), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleAllow = async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                // Gửi notification chào mừng
                const reg = await navigator.serviceWorker.ready;
                if (reg.showNotification) {
                    reg.showNotification('TOAN Store 🎉', {
                        body: 'Bạn sẽ nhận thông báo về đơn hàng, khuyến mãi và sản phẩm mới!',
                        icon: '/logo.svg',
                        badge: '/logo.svg',
                        tag: 'welcome',
                    });
                }
            }
        } catch (err) {
            console.error('Push notification error:', err);
        }
        setShow(false);
    };

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem('push_notification_dismissed', Date.now().toString());
    };

    if (!show) return null;

    return (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-[9998] animate-in slide-in-from-top duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-black">Bật thông báo</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Nhận cập nhật về đơn hàng, Flash Sale và ưu đãi độc quyền.
                    </p>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleAllow}
                            className="px-4 py-1.5 bg-black text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
                        >
                            Cho phép
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-50 transition-colors"
                        >
                            Để sau
                        </button>
                    </div>
                </div>
                <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
