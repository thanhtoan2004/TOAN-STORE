"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseStockReservationProps {
    sessionId: string;
    enabled?: boolean;
}

interface ReservationStatus {
    isReserved: boolean;
    expiresAt?: Date;
    timeRemaining?: number;
}

export function useStockReservation({ sessionId, enabled = true }: UseStockReservationProps) {
    const [status, setStatus] = useState<ReservationStatus>({ isReserved: false });
    const [isReserving, setIsReserving] = useState(false);
    const router = useRouter();

    // Reserve stock
    const reserve = useCallback(async (items: { productVariantId: number; quantity: number }[]) => {
        if (!enabled) return { success: false };

        setIsReserving(true);
        try {
            const response = await fetch('/api/cart/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, items })
            });

            const data = await response.json();

            if (data.success) {
                setStatus({
                    isReserved: true,
                    expiresAt: new Date(Date.now() + data.expiresIn * 1000)
                });
            }

            return data;
        } catch (error) {
            console.error('Reserve error:', error);
            return { success: false, message: 'Lỗi khi đặt chỗ sản phẩm' };
        } finally {
            setIsReserving(false);
        }
    }, [sessionId, enabled]);

    // Release stock
    const release = useCallback(async () => {
        if (!enabled) return;

        try {
            await fetch('/api/cart/release', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            setStatus({ isReserved: false });
        } catch (error) {
            console.error('Release error:', error);
        }
    }, [sessionId, enabled]);

    // Update time remaining
    useEffect(() => {
        if (!status.isReserved || !status.expiresAt) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, status.expiresAt!.getTime() - Date.now());

            if (remaining === 0) {
                setStatus({ isReserved: false });
                // Redirect to cart or show expired message
                router.push('/cart?expired=true');
            } else {
                setStatus(prev => ({ ...prev, timeRemaining: remaining }));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [status.isReserved, status.expiresAt, router]);

    // Auto-release on unmount
    useEffect(() => {
        return () => {
            if (status.isReserved) {
                // Release stock when leaving checkout page
                fetch('/api/cart/release', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                    keepalive: true // Ensure request completes even if page is closing
                }).catch(console.error);
            }
        };
    }, [status.isReserved, sessionId]);

    return {
        status,
        reserve,
        release,
        isReserving
    };
}
