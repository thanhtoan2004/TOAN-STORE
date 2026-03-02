'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    id?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled = false, id }) => {
    return (
        <button
            type="button"
            id={id}
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full 
                transition-colors focus-visible:outline-none focus-visible:ring-2 
                focus-visible:ring-black focus-visible:ring-offset-2 
                disabled:cursor-not-allowed disabled:opacity-50
                ${checked ? 'bg-black' : 'bg-gray-200'}
            `}
        >
            <motion.span
                animate={{ x: checked ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`
                    pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0
                `}
            />
        </button>
    );
};
