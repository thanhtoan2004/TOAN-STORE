"use client";

import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
}) => {
    const baseClasses = 'bg-gray-200 block overflow-hidden relative';

    const variantClasses = {
        text: 'h-4 w-full rounded mb-1',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-xl',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'after:content-[""] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:animate-shimmer',
        none: '',
    };

    const styles = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={styles}
        />
    );
};

export default Skeleton;
