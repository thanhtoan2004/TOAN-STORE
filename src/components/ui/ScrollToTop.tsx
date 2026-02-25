'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, RefreshCw } from 'lucide-react';

/**
 * ScrollToTop + Pull-to-Refresh Component.
 * - Desktop & Mobile: Nút scroll to top khi cuộn quá 300px
 * - Mobile: Kéo xuống ở đầu trang để refresh (Pull-to-refresh)
 * - Vị trí bottom nâng cao trên mobile để tránh BottomNavBar
 */
export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const touchStartRef = useRef(0);
    const PULL_THRESHOLD = 80;

    // Show/hide button
    useEffect(() => {
        const toggleVisibility = () => {
            setIsVisible(window.scrollY > 300);
        };
        window.addEventListener('scroll', toggleVisibility, { passive: true });
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    // Pull-to-refresh for mobile
    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                touchStartRef.current = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (touchStartRef.current === 0) return;
            const diff = e.touches[0].clientY - touchStartRef.current;
            if (diff > 0 && window.scrollY === 0) {
                setPullDistance(Math.min(diff * 0.4, PULL_THRESHOLD + 20));
            }
        };

        const handleTouchEnd = () => {
            if (pullDistance >= PULL_THRESHOLD) {
                setIsRefreshing(true);
                setPullDistance(PULL_THRESHOLD);
                setTimeout(() => {
                    window.location.reload();
                }, 600);
            } else {
                setPullDistance(0);
            }
            touchStartRef.current = 0;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [pullDistance]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {/* Pull-to-refresh indicator (Mobile only) */}
            {pullDistance > 0 && (
                <div
                    className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-center pointer-events-none md:hidden"
                    style={{ height: `${pullDistance}px`, transition: isRefreshing ? 'none' : 'height 0.1s' }}
                >
                    <div
                        className={`bg-black text-white rounded-full p-2 shadow-lg ${isRefreshing ? 'animate-spin' : ''
                            }`}
                        style={{
                            transform: `rotate(${Math.min(pullDistance / PULL_THRESHOLD * 360, 360)}deg)`,
                            opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
                        }}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </div>
                </div>
            )}

            {/* Scroll to Top Button — bottom-20 on mobile (above BottomNavBar), bottom-8 on desktop */}
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 p-3 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 opacity-90 hover:opacity-100 no-print"
                    aria-label="Scroll to top"
                >
                    <ChevronUp size={24} />
                </button>
            )}
        </>
    );
}
