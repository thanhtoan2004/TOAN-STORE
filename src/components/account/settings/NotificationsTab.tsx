'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/Switch';

interface NotificationsTabProps {
    emailNotifications: boolean;
    setEmailNotifications: (val: boolean) => void;
    promoNotifications: boolean;
    setPromoNotifications: (val: boolean) => void;
    orderNotifications: boolean;
    setOrderNotifications: (val: boolean) => void;
    smsNotifications: boolean;
    setSmsNotifications: (val: boolean) => void;
    smsOrderNotifications: boolean;
    setSmsOrderNotifications: (val: boolean) => void;
    pushNotifications: boolean;
    setPushNotifications: (val: boolean) => void;
    onSave: () => void;
    loading?: boolean;
}

// Premium SVGs
const MailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const PhoneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
);

const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
);

export default function NotificationsTab({
    emailNotifications,
    setEmailNotifications,
    promoNotifications,
    setPromoNotifications,
    orderNotifications,
    setOrderNotifications,
    smsNotifications,
    setSmsNotifications,
    smsOrderNotifications,
    setSmsOrderNotifications,
    pushNotifications,
    setPushNotifications,
    onSave,
    loading
}: NotificationsTabProps) {
    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-2xl"
        >
            <h2 className="text-2xl font-bold mb-8">Thông báo</h2>

            <div className="space-y-6">
                {/* Email Notifications Segment */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                            <MailIcon />
                        </div>
                        <h3 className="text-lg font-bold">Thông báo Email</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Email tổng quát</p>
                                <p className="text-sm text-gray-500">Nhận thông tin cập nhật chính từ tài khoản</p>
                            </div>
                            <Switch checked={emailNotifications} onChange={setEmailNotifications} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Email Khuyến mãi</p>
                                <p className="text-sm text-gray-500">Thông báo về deal hời và bộ sưu tập mới</p>
                            </div>
                            <Switch checked={promoNotifications} onChange={setPromoNotifications} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Email Đơn hàng</p>
                                <p className="text-sm text-gray-500">Trạng thái vận chuyển và xác nhận thanh toán</p>
                            </div>
                            <Switch checked={orderNotifications} onChange={setOrderNotifications} />
                        </div>
                    </div>
                </motion.div>

                {/* SMS Notifications Segment */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                            <PhoneIcon />
                        </div>
                        <h3 className="text-lg font-bold">Thông báo SMS</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Tin nhắn định kỳ</p>
                                <p className="text-sm text-gray-500">Nhận các thông báo quan trọng qua SMS</p>
                            </div>
                            <Switch checked={smsNotifications} onChange={setSmsNotifications} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">SMS Đơn hàng</p>
                                <p className="text-sm text-gray-500">Cập nhật vị trí đơn hàng thời gian thực</p>
                            </div>
                            <Switch checked={smsOrderNotifications} onChange={setSmsOrderNotifications} />
                        </div>
                    </div>
                </motion.div>

                {/* Push Notifications Segment */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                            <BellIcon />
                        </div>
                        <h3 className="text-lg font-bold">Thông báo Đẩy</h3>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">Thông báo từ trình duyệt</p>
                            <p className="text-sm text-gray-500">Nhận cập nhật ngay cả khi bạn không mở web</p>
                        </div>
                        <Switch checked={pushNotifications} onChange={setPushNotifications} />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-6 flex justify-end">
                    <button
                        onClick={onSave}
                        disabled={loading}
                        className="px-10 py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:bg-gray-400 shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Đang lưu...</span>
                            </div>
                        ) : 'Lưu thay đổi'}
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
}
