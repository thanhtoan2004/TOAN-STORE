'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MembershipTabProps {
    currentTier: string;
    currentPoints: number;
    progress: number;
    nextCheckpoint: number;
}

// Premium SVGs
const AwardIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
);

const StarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const ZapIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const CrownIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    </svg>
);

const ShieldCheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 11 12 14 15 11" />
    </svg>
);

const TIER_CONFIG: {
    [key: string]: {
        name: string;
        range: string;
        benefits: string[];
        gradient: string;
        icon: any;
        textColor: string;
        borderColor: string;
    }
} = {
    bronze: {
        name: 'Đồng (Bronze)',
        range: '0 - 999 điểm',
        benefits: ['Tích điểm đổi quà', 'Ưu đãi sinh nhật'],
        gradient: 'from-[#8D5524] to-[#C68642]',
        icon: StarIcon,
        textColor: 'text-amber-900',
        borderColor: 'border-amber-200'
    },
    silver: {
        name: 'Bạc (Silver)',
        range: '1,000 - 4,999 điểm',
        benefits: ['Tất cả quyền lợi hạng Đồng', 'Freeship mọi đơn hàng', 'Giảm 5% khi mua hàng'],
        gradient: 'from-[#757575] to-[#BDBDBD]',
        icon: ZapIcon,
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300'
    },
    gold: {
        name: 'Vàng (Gold)',
        range: '5,000 - 9,999 điểm',
        benefits: ['Tất cả quyền lợi hạng Bạc', 'Giảm 10% khi mua hàng', 'Quà tặng độc quyền'],
        gradient: 'from-[#D4AF37] to-[#FFD700]',
        icon: CrownIcon,
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300'
    },
    platinum: {
        name: 'Bạch kim (Platinum)',
        range: '10,000+ điểm',
        benefits: ['Tất cả quyền lợi hạng Vàng', 'Giảm 15% khi mua hàng', 'Ưu đãi VIP & Early Access'],
        gradient: 'from-[#303F9F] to-[#7986CB]',
        icon: ShieldCheckIcon,
        textColor: 'text-indigo-900',
        borderColor: 'border-indigo-200'
    }
};

export default function MembershipTab({
    currentTier,
    currentPoints,
    progress,
    nextCheckpoint,
}: MembershipTabProps) {
    const safeTier = (currentTier?.toLowerCase() as keyof typeof TIER_CONFIG) || 'bronze';
    const activeTier = TIER_CONFIG[safeTier];
    const TierIcon = activeTier.icon;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 border-2 border-black rounded-xl">
                        <AwardIcon />
                    </div>
                    Hạng thành viên
                </h2>
                <div className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Chương trình khách hàng thân thiết
                </div>
            </div>

            {/* Premium Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden p-8 rounded-[2rem] text-white shadow-2xl bg-gradient-to-br ${activeTier.gradient}`}
            >
                {/* Decorative background elements */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                                <TierIcon className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/80 uppercase tracking-[0.2em]">Hạng hiện tại</p>
                                <h3 className="text-4xl font-extrabold tracking-tight uppercase">
                                    {activeTier.name.split(' (')[0]}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="text-left md:text-right bg-black/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                        <p className="text-sm font-medium text-white/80 uppercase tracking-widest">Điểm tích lũy</p>
                        <p className="text-4xl font-black">{currentPoints.toLocaleString('vi-VN')}</p>
                        <p className="text-xs font-bold text-white/60">TOAN POINTS</p>
                    </div>
                </div>

                <div className="mt-12 space-y-4 relative z-10">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-widest text-white/80">Tiến trình thăng hạng</span>
                            <div className="text-4xl font-black">{Math.round(progress)}%</div>
                        </div>
                        <div className="text-right">
                            {currentTier?.toLowerCase() !== 'platinum' ? (
                                <p className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                                    Còn <span className="underline decoration-2">{Math.max(0, nextCheckpoint - currentPoints).toLocaleString('vi-VN')}</span> điểm để lên hạng kế tiếp
                                </p>
                            ) : (
                                <p className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                                    Bạn đã đạt cấp độ tối thượng!
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10 p-0.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(TIER_CONFIG).map(([key, config], index) => {
                    const isActive = safeTier === key;
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-6 rounded-3xl border-2 transition-all duration-300 ${isActive
                                ? `bg-white ${config.borderColor} shadow-xl ring-4 ring-black/5 scale-[1.02] z-10`
                                : 'bg-gray-50 border-gray-100 hover:border-gray-200 grayscale-[0.5] opacity-80'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                                    Hạng của bạn
                                </div>
                            )}

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${config.gradient} shadow-lg`}>
                                <Icon />
                            </div>

                            <h4 className={`font-black text-lg mb-1 uppercase tracking-tight ${config.textColor}`}>
                                {config.name.split(' (')[0]}
                            </h4>
                            <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">{config.range}</p>

                            <ul className="space-y-3">
                                {config.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs font-bold text-gray-700 leading-relaxed">
                                        <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-black' : 'bg-gray-300'}`} />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    );
                })}
            </div>

            {/* CTA/Info Box */}
            <div className="p-8 bg-black text-white rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div>
                    <h3 className="text-xl font-bold mb-2">Cách tích điểm?</h3>
                    <p className="text-sm text-gray-400 max-w-md">
                        Bạn sẽ nhận được <span className="text-white font-bold">1 điểm cho mỗi 1.000 VNĐ</span> giá trị đơn hàng được giao thành công. Điểm thưởng có thể dùng để đổi Voucher và các ưu đãi đặc quyền khác.
                    </p>
                </div>
                <button className="px-8 py-4 bg-white text-black rounded-full font-black text-sm uppercase hover:bg-gray-200 transition-colors shrink-0">
                    Tìm hiểu thêm về quyền lợi
                </button>
            </div>
        </div>
    );
}
