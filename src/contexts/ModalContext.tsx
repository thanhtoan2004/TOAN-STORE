"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertModal from '@/components/ui/AlertModal';

interface ModalOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    type?: 'auth' | 'info' | 'error' | 'success';
}

interface ModalContextType {
    showAlert: (options: ModalOptions) => void;
    hideAlert: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [modalConfig, setModalConfig] = useState<ModalOptions | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const showAlert = (options: ModalOptions) => {
        setModalConfig(options);
        setIsOpen(true);
    };

    const hideAlert = () => {
        setIsOpen(false);
        // Delay clearing config to allow animation to finish
        setTimeout(() => setModalConfig(null), 300);
    };

    return (
        <ModalContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {modalConfig && (
                <AlertModal
                    isOpen={isOpen}
                    onClose={hideAlert}
                    {...modalConfig}
                />
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
