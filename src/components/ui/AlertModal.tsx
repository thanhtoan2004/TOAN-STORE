"use client";

import React from 'react';
import { X, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    type?: 'auth' | 'info' | 'error' | 'success';
}

export default function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    onConfirm,
    type = 'info'
}: AlertModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    const isAuth = type === 'auth';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                <div className="flex flex-col items-center text-center">
                    {isAuth && (
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <LogIn className="w-8 h-8 text-black" />
                        </div>
                    )}

                    <h2 className="text-2xl font-bold text-black mb-3">{title}</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={handleConfirm}
                            className="w-full py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all active:scale-[0.98]"
                        >
                            {isAuth ? 'Đăng nhập ngay' : confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-white text-black border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
