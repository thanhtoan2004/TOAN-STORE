'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/Switch';

interface PrivacyTabProps {
    handleExportData: () => void;
    handleDeleteAccount: () => void;
    loading: boolean;
    dataPersistence: boolean;
    setDataPersistence: (val: boolean) => void;
    publicProfile: boolean;
    setPublicProfile: (val: boolean) => void;
    showAlert: (config: any) => void;
    onSave: () => void;
}

// Premium SVGs
const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const TrashIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

export default function PrivacyTab({
    handleExportData,
    handleDeleteAccount,
    loading,
    dataPersistence,
    setDataPersistence,
    publicProfile,
    setPublicProfile,
    showAlert,
    onSave
}: PrivacyTabProps) {
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
            <h2 className="text-2xl font-bold mb-8">Quyền riêng tư</h2>

            <div className="space-y-6">
                {/* Data Visibility & Persistence */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                            <ShieldIcon />
                        </div>
                        <h3 className="text-lg font-bold">Tùy chọn hiển thị & Dữ liệu</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Cá nhân hóa trải nghiệm</p>
                                <p className="text-sm text-gray-500">Cho phép sử dụng dữ liệu để gợi ý sản phẩm phù hợp</p>
                            </div>
                            <Switch checked={dataPersistence} onChange={setDataPersistence} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Tài khoản công khai</p>
                                <p className="text-sm text-gray-500">Cho phép người khác tìm thấy hồ sơ của bạn</p>
                            </div>
                            <Switch checked={publicProfile} onChange={setPublicProfile} />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end border-t border-gray-50 mt-6">
                        <button
                            onClick={onSave}
                            disabled={loading}
                            className="px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:bg-gray-400 shadow-md"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </motion.div>

                {/* Personal Data Export */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                            <DownloadIcon />
                        </div>
                        <h3 className="text-lg font-bold">Dữ liệu cá nhân</h3>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">Tải xuống toàn bộ thông tin cá nhân của bạn theo tiêu chuẩn GDPR. Tệp sẽ ở định dạng JSON.</p>

                    <button
                        onClick={handleExportData}
                        disabled={loading}
                        className="w-full sm:w-auto px-6 py-4 border-2 border-black rounded-full font-bold hover:bg-black hover:text-white transition-all disabled:border-gray-200 disabled:text-gray-400 active:scale-95"
                    >
                        {loading ? 'Đang chuẩn bị...' : 'Xuất dữ liệu cá nhân (JSON)'}
                    </button>
                </motion.div>

                {/* Data Deletion */}
                <motion.div variants={itemVariants} className="group overflow-hidden bg-white border border-red-50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <div className="p-2.5 bg-red-50 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <TrashIcon />
                        </div>
                        <h3 className="text-lg font-bold">Xóa tài khoản</h3>
                    </div>

                    <p className="text-sm text-gray-500 mb-6 font-medium">Lưu ý: Hành động này sẽ xóa vĩnh viễn tài khoản và toàn bộ lịch sử mua hàng của bạn. Không thể hoàn tác.</p>

                    <button
                        onClick={() => {
                            showAlert({
                                title: 'Xác nhận xóa tài khoản',
                                message: 'Bạn có chắc chắn muốn xóa tài khoản vĩnh viễn không? Toàn bộ dữ liệu của bạn sẽ bị gỡ bỏ khỏi hệ thống.',
                                confirmText: 'Xác nhận xóa',
                                cancelText: 'Hủy',
                                danger: true,
                                onConfirm: () => handleDeleteAccount()
                            });
                        }}
                        className="w-full sm:w-auto px-6 py-4 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>Xóa tài khoản vĩnh viễn</span>
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
}
