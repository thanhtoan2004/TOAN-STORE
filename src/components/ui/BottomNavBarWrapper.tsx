'use client';

import dynamic from 'next/dynamic';

const BottomNavBar = dynamic(() => import('@/components/ui/BottomNavBar'), { ssr: false });

export default function BottomNavBarWrapper() {
    return <BottomNavBar />;
}
