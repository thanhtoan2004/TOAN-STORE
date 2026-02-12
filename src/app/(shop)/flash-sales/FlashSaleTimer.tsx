
"use client";
import React, { useEffect, useState } from 'react';

interface FlashSaleTimerProps {
    endTime: string;
}

export default function FlashSaleTimer({ endTime }: FlashSaleTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            const distance = end - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft(null);
                return;
            }

            setTimeLeft({
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    if (!timeLeft) return <span className="text-white font-bold">Đã kết thúc</span>;

    return (
        <div className="flex gap-1 font-mono text-xl font-bold bg-black/20 px-3 py-1 rounded">
            <span>{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span>:</span>
            <span>{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span>:</span>
            <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
        </div>
    );
}
