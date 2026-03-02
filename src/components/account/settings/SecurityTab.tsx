'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Skeleton from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';

interface SecurityTabProps {
    user: any;
    loading: boolean;
    sessions: any[];
    loadingSessions: boolean;
    revokingSession: string | null;
    loadSessions: () => void;
    revokeSession: (sessionId: string) => void;
    setConfirmConfig: (config: any) => void;
    setIsConfirmModalOpen: (val: boolean) => void;
    setPendingAction: (action: 'export' | 'delete' | 'toggle2fa' | null) => void;
    setPasswordValue: (val: string) => void;
    setPasswordError: (val: string) => void;
    setIsPasswordModalOpen: (val: boolean) => void;
    setMessage: (msg: string) => void;
    setLoading: (val: boolean) => void;
}

// Premium SVGs
const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

const SmartphoneIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
);

const MonitorIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

const PowerIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64a9 9 0 11-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
);

export default function SecurityTab({
    user,
    loading,
    sessions,
    loadingSessions,
    revokingSession,
    loadSessions,
    revokeSession,
    setConfirmConfig,
    setIsConfirmModalOpen,
    setPendingAction,
    setPasswordValue,
    setPasswordError,
    setIsPasswordModalOpen,
    setMessage,
    setLoading
}: SecurityTabProps) {
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
            <h2 className="text-2xl font-bold mb-8">Bảo mật</h2>

            <div className="space-y-6">
                {/* 2FA Section */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gray-50 rounded-xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                                <ShieldIcon />
                            </div>
                            <h3 className="text-lg font-bold">Xác thực 2 bước (2FA)</h3>
                        </div>
                        <Switch
                            checked={!!user?.two_factor_enabled}
                            onChange={() => {
                                setPendingAction('toggle2fa');
                                setPasswordValue('');
                                setPasswordError('');
                                setIsPasswordModalOpen(true);
                            }}
                            disabled={loading}
                        />
                    </div>
                    <p className="text-sm text-gray-500 pr-12">
                        Bảo vệ tài khoản của bạn bằng cách yêu cầu mã xác thực gửi qua email mỗi khi đăng nhập từ thiết bị mới.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user?.two_factor_enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm font-medium text-gray-600">
                            {user?.two_factor_enabled ? 'Đang kích hoạt' : 'Chưa kích hoạt'}
                        </span>
                    </div>
                </motion.div>

                {/* Password Change */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                            <LockIcon />
                        </div>
                        <h3 className="text-lg font-bold">Mật khẩu</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Cập nhật mật khẩu thường xuyên để tăng cường bảo mật cho tài khoản.</p>
                    <Link href="/account/change-password">
                        <button className="px-8 py-3 border-2 border-black rounded-full font-bold hover:bg-black hover:text-white transition-all active:scale-95">
                            Đổi mật khẩu
                        </button>
                    </Link>
                </motion.div>

                {/* Active Sessions */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gray-50 rounded-xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                                <MonitorIcon />
                            </div>
                            <h3 className="text-lg font-bold">Thiết bị đang hoạt động</h3>
                        </div>
                        <button onClick={loadSessions} className="text-sm font-bold text-gray-400 hover:text-black transition-colors underline decoration-2 underline-offset-4">
                            Làm mới
                        </button>
                    </div>

                    {loadingSessions ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <Skeleton key={i} variant="rounded" height={80} className="rounded-2xl" />
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-400 italic font-medium">Không có dữ liệu thiết bị khác</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-white hover:border-gray-200 transition-all group/session">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover/session:text-black group-hover/session:scale-110 transition-all">
                                            {s.device === 'Mobile' ? <SmartphoneIcon /> : <MonitorIcon />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{s.os || 'Unknown OS'}</p>
                                            <p className="text-xs text-gray-500 font-medium">{s.browser} · IP: {s.ip}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">{s.loginAt ? new Date(s.loginAt).toLocaleString('vi-VN') : '-'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => revokeSession(s.id)}
                                        disabled={revokingSession === s.id}
                                        className="text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition-all px-4 py-2 border border-red-100 rounded-full hover:shadow-md disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        {revokingSession === s.id ? '...' : 'Thu hồi'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Force Logout All */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <div className="p-2.5 bg-white rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm">
                            <PowerIcon />
                        </div>
                        <h3 className="text-lg font-bold">An toàn tối đa</h3>
                    </div>
                    <p className="text-sm text-red-700 mb-6 font-medium">
                        Bạn bị mất máy hoặc nghi ngờ tài khoản bị lộ? Hãy dùng tính năng này để đăng xuất khỏi TẤT CẢ các thiết bị ngay lập tức.
                    </p>
                    <button
                        onClick={async () => {
                            setConfirmConfig({
                                title: 'Đăng xuất khỏi tất cả thiết bị',
                                message: 'Hệ thống sẽ ép buộc đăng xuất trên mọi thiết bị hiện tại (bao gồm cả trình duyệt này). Bạn sẽ cần đăng nhập lại.',
                                confirmText: 'Đăng xuất ngay',
                                cancelText: 'Hủy',
                                danger: true,
                                onConfirm: async () => {
                                    setIsConfirmModalOpen(false);
                                    try {
                                        setLoading(true);
                                        const res = await fetch('/api/auth/logout-all', { method: 'POST' });
                                        const data = await res.json();
                                        if (data.success) {
                                            window.location.href = '/login?message=Thành công đăng xuất khỏi tất cả thiết bị';
                                        } else {
                                            setMessage(data.message || 'Lỗi khi đăng xuất');
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        setMessage('Có lỗi xảy ra. Vui lòng thử lại sau.');
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            });
                            setIsConfirmModalOpen(true);
                        }}
                        disabled={loading}
                        className="w-full sm:w-auto px-6 py-4 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                    >
                        <span>Đăng xuất tất cả thiết bị</span>
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
}
