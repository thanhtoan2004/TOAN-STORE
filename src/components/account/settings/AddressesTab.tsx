'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';

interface AddressesTabProps {
    user: any;
    t: any;
    returnUrl: string | null;
    showAddressForm: boolean;
    setShowAddressForm: (val: boolean) => void;
    editingAddress: any;
    setEditingAddress: (val: any) => void;
    addressForm: any;
    setAddressForm: (val: any) => void;
    handleAddressFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleAddressSubmit: (e: React.FormEvent) => void;
    handleDeleteAddress: (addressId: number) => void;
    handleSetDefaultAddress: (addressId: number) => void;
    handleEditAddress: (address: any) => void;
    loading: boolean;
    loadingAddresses: boolean;
    addresses: any[];
}

// Premium SVGs
const MapPinIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
);

export default function AddressesTab({
    user,
    t,
    returnUrl,
    showAddressForm,
    setShowAddressForm,
    editingAddress,
    setEditingAddress,
    addressForm,
    setAddressForm,
    handleAddressFormChange,
    handleAddressSubmit,
    handleDeleteAddress,
    handleSetDefaultAddress,
    handleEditAddress,
    loading,
    loadingAddresses,
    addresses
}: AddressesTabProps) {
    const router = useRouter();

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
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-3xl"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">{t.common.addresses}</h2>
                    {returnUrl && (
                        <button
                            onClick={() => router.push(returnUrl)}
                            className="px-4 py-2 text-xs border border-blue-200 text-blue-600 rounded-full font-bold hover:bg-blue-50 transition-all active:scale-95"
                        >
                            ← Quay lại Checkout
                        </button>
                    )}
                </div>
                {!showAddressForm && (
                    <button
                        onClick={() => {
                            setShowAddressForm(true);
                            setEditingAddress(null);
                            setAddressForm({
                                label: '',
                                recipient_name: '',
                                phone: '',
                                address_line: '',
                                city: '',
                                state: '',
                                postal_code: '',
                                is_default: false
                            });
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                        <PlusIcon />
                        <span>{t.common.add_address}</span>
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {showAddressForm && (
                    <motion.div
                        key="address-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 overflow-hidden bg-gray-50 border border-gray-100 rounded-3xl p-6 sm:p-8"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <div className="p-2 bg-black text-white rounded-lg scale-75"><MapPinIcon /></div>
                            <span>{editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ giao hàng'}</span>
                        </h3>

                        <form onSubmit={handleAddressSubmit} className="space-y-5" autoComplete="off">
                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1 group-focus-within:text-black transition-colors">Nhãn địa chỉ</label>
                                <input
                                    type="text"
                                    name="label"
                                    value={addressForm.label}
                                    onChange={handleAddressFormChange}
                                    placeholder="Ví dụ: Nhà riêng, Công ty..."
                                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1 group-focus-within:text-black transition-colors">Họ và tên *</label>
                                    <input
                                        type="text"
                                        name="recipient_name"
                                        value={addressForm.recipient_name}
                                        onChange={handleAddressFormChange}
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1 group-focus-within:text-black transition-colors">Số điện thoại *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={addressForm.phone}
                                        onChange={handleAddressFormChange}
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1 group-focus-within:text-black transition-colors">Địa chỉ chi tiết *</label>
                                <input
                                    type="text"
                                    name="address_line"
                                    value={addressForm.address_line}
                                    onChange={handleAddressFormChange}
                                    required
                                    placeholder="Số nhà, tên tòa nhà, tên đường..."
                                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1 group-focus-within:text-black transition-colors">Thành phố *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={addressForm.city}
                                        onChange={handleAddressFormChange}
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1 group-focus-within:text-black transition-colors">Quận/Huyện</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={addressForm.state}
                                        onChange={handleAddressFormChange}
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1 group-focus-within:text-black transition-colors">Mã bưu chính</label>
                                    <input
                                        type="text"
                                        name="postal_code"
                                        value={addressForm.postal_code}
                                        onChange={handleAddressFormChange}
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-sm font-bold text-gray-600">Đặt làm địa chỉ mặc định</span>
                                <Switch
                                    checked={addressForm.is_default}
                                    onChange={(val) => setAddressForm({ ...addressForm, is_default: val })}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:bg-gray-400"
                                >
                                    {loading ? 'Đang xử lý...' : editingAddress ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddressForm(false);
                                        setEditingAddress(null);
                                    }}
                                    className="flex-1 py-4 border-2 border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loadingAddresses ? (
                <div className="space-y-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-6 border border-gray-100 rounded-3xl bg-white space-y-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3 w-full">
                                    <Skeleton variant="text" width="20%" height={24} className="rounded-lg" />
                                    <Skeleton variant="text" width="40%" height={32} className="rounded-lg" />
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="text" width="50%" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {addresses.length === 0 ? (
                        <motion.div variants={itemVariants} className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="flex justify-center mb-4 text-gray-300 scale-150 rotate-12"><MapPinIcon /></div>
                            <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">{t.common.no_addresses || 'Bạn chưa có địa chỉ giao hàng nào'}</p>
                        </motion.div>
                    ) : (
                        addresses.map((address: any) => (
                            <motion.div
                                key={address.id}
                                layout
                                initial="hidden"
                                animate="visible"
                                variants={itemVariants}
                                className={`group p-6 border rounded-3xl transition-all shadow-md hover:shadow-xl ${address.is_default ? 'border-2 border-black bg-white' : 'border-gray-200 bg-white'}`}
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl transition-colors ${address.is_default ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-white'}`}>
                                            <MapPinIcon />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-lg">{address.label || 'Địa chỉ'}</span>
                                                {address.is_default === 1 && (
                                                    <span className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-bold uppercase tracking-tighter">Mặc định</span>
                                                )}
                                            </div>
                                            <p className="font-bold text-gray-900 text-sm">{address.recipient_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleEditAddress(address)}
                                            className="flex-1 sm:flex-none p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all active:scale-95"
                                            title="Chỉnh sửa"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAddress(address.id)}
                                            className="flex-1 sm:flex-none p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                            title="Xóa"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-gray-500 text-sm space-y-1.5 ml-0 sm:ml-14 font-medium italic">
                                    <p className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-300" /> {address.phone}</p>
                                    <p className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-300" /> {address.address_line}</p>
                                    <p className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-300" /> {address.city}, {address.state} {address.postal_code}</p>
                                </div>
                                {!address.is_default && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => handleSetDefaultAddress(address.id)}
                                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors border-b-2 border-transparent hover:border-black py-0.5"
                                        >
                                            Đặt làm mặc định
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </motion.div>
    );
}
