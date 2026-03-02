'use client';

import React from 'react';
import { User, Camera, X, ShieldCheck, Crown, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Skeleton from '@/components/ui/Skeleton';

interface PersonalInfoTabProps {
    user: any;
    formData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dateOfBirth: string;
        gender: string;
        avatarUrl: string;
    };
    isUploading: boolean;
    setIsUploading: (val: boolean) => void;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    t: any;
}

export default function PersonalInfoTab({
    user,
    formData,
    isUploading,
    setIsUploading,
    setFormData,
    handleChange,
    handleSubmit,
    loading,
    t
}: PersonalInfoTabProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">{t.common.profile}</h2>
            </div>

            {/* Avatar Upload Section */}
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md relative bg-gray-200 flex items-center justify-center">
                            {formData.avatarUrl ? (
                                <img
                                    src={formData.avatarUrl}
                                    alt="Avatar Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-10 h-10 text-gray-400" />
                            )}

                            <AnimatePresence>
                                {isUploading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center"
                                    >
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <label className="absolute bottom-0 right-0 p-1.5 bg-black text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                            <Camera className="w-4 h-4" />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    // Validate file size (max 5MB for avatar)
                                    if (file.size > 5 * 1024 * 1024) {
                                        toast.error('Ảnh quá lớn (tối đa 5MB)');
                                        return;
                                    }

                                    setIsUploading(true);
                                    try {
                                        const uploadFormData = new FormData();
                                        uploadFormData.append('file', file);

                                        const res = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: uploadFormData,
                                        });

                                        const data = await res.json();
                                        if (data.success) {
                                            setFormData((prev: any) => ({ ...prev, avatarUrl: data.imageUrl }));
                                            toast.success('Đã tải ảnh lên! Hãy nhấn Lưu để cập nhật.');
                                        } else {
                                            toast.error(data.error || 'Lỗi khi tải ảnh');
                                        }
                                    } catch (err) {
                                        toast.error('Lỗi kết nối server');
                                    } finally {
                                        setIsUploading(false);
                                    }
                                }}
                            />
                        </label>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">Thông tin cá nhân</h3>
                            {user?.membershipTier && (
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm border ${user.membershipTier === 'platinum' ? 'bg-gradient-to-r from-indigo-600 to-indigo-400 text-white border-indigo-200' :
                                    user.membershipTier === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-yellow-300 text-amber-900 border-yellow-200' :
                                        user.membershipTier === 'silver' ? 'bg-gradient-to-r from-gray-500 to-gray-300 text-white border-gray-200' :
                                            'bg-gradient-to-r from-amber-700 to-amber-500 text-white border-amber-400'
                                    }`}>
                                    {user.membershipTier === 'platinum' && <ShieldCheck className="w-3 h-3" />}
                                    {user.membershipTier === 'gold' && <Crown className="w-3 h-3" />}
                                    {user.membershipTier === 'silver' && <Zap className="w-3 h-3" />}
                                    {user.membershipTier === 'bronze' && <Star className="w-3 h-3" />}
                                    {user.membershipTier} Member
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                            Quản lý thông tin hồ sơ của bạn và cách hiển thị trên hệ thống.
                        </p>
                        {formData.avatarUrl && (
                            <button
                                type="button"
                                onClick={() => setFormData((prev: any) => ({ ...prev, avatarUrl: '' }))}
                                className="text-xs font-semibold text-red-600 flex items-center gap-1 hover:underline mx-auto md:mx-0"
                            >
                                <X className="w-3 h-3" />
                                Gỡ ảnh hiện tại
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <Skeleton variant="circular" width={96} height={96} />
                            <div className="flex-1 space-y-2">
                                <Skeleton variant="text" width="40%" />
                                <Skeleton variant="text" width="80%" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton variant="text" width="30%" />
                            <Skeleton variant="rounded" height={48} />
                        </div>
                        <div className="space-y-2">
                            <Skeleton variant="text" width="30%" />
                            <Skeleton variant="rounded" height={48} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton variant="text" width="20%" />
                        <Skeleton variant="rounded" height={48} />
                    </div>
                    <div className="space-y-2">
                        <Skeleton variant="text" width="25%" />
                        <Skeleton variant="rounded" height={48} />
                    </div>
                    <div className="pt-4">
                        <Skeleton variant="rounded" height={56} className="rounded-full" />
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t.common.last_name} *</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required autoComplete="family-name" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">{t.common.first_name} *</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required autoComplete="given-name" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{t.common.email} *</label>
                        <input type="email" name="email" value={formData.email} disabled className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 cursor-not-allowed" />
                        <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{t.common.phone}</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0123456789" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{t.common.dob}</label>
                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{t.common.gender}</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="">{t.common.select_gender}</option>
                            <option value="male">{t.common.male}</option>
                            <option value="female">{t.common.female}</option>
                            <option value="other">{t.common.other}</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white rounded-full py-4 font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t.common.saving}
                                </>
                            ) : (
                                t.common.save_changes
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
