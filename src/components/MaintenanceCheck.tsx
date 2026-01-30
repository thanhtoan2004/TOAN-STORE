'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function MaintenanceCheck({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Skip check for admin routes and maintenance page
        if (pathname?.startsWith('/admin') || pathname === '/maintenance') {
            setIsChecking(false);
            return;
        }

        // Check maintenance mode
        fetch('/api/maintenance-check')
            .then(res => res.json())
            .then(data => {
                if (data.maintenance === true) {
                    router.push('/maintenance');
                } else {
                    setIsChecking(false);
                }
            })
            .catch(() => {
                // On error, allow access
                setIsChecking(false);
            });
    }, [pathname, router]);

    // Show loading or nothing while checking
    if (isChecking) {
        return null;
    }

    return <>{children}</>;
}
