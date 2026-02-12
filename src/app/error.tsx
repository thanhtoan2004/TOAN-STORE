'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to an error reporting service
        console.error('Root Error Boundary:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Nike Logo Placeholder or Icon */}
                <div className="flex justify-center">
                    <svg height="60" width="60" viewBox="0 0 24 24" fill="black">
                        <path d="M21 8.719L7.836 14.303C6.74 14.768 5.818 15 5.075 15c-.836 0-1.445-.295-1.819-.884-.485-.76-.273-1.982.559-3.272.494-.754 1.122-1.446 1.734-2.108-.144.234-1.415 2.349-.025 3.345.275.2.666.298 1.147.298.386 0 .829-.063 1.316-.19L21 8.719z" />
                    </svg>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight uppercase italic">
                        Something went wrong
                    </h1>
                    <p className="text-gray-600">
                        We're sorry for the inconvenience. Our team has been notified and we're working to fix the issue.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => reset()}
                        className="w-full bg-black text-white rounded-full py-6 text-lg hover:bg-gray-800 transition-all font-medium"
                    >
                        Try again
                    </Button>

                    <Link href="/" className="w-full text-center py-4 text-sm font-semibold underline underline-offset-4 hover:text-gray-600 transition-colors">
                        Back to homepage
                    </Link>
                </div>

                <div className="pt-12 text-xs text-gray-400">
                    {error.digest && <span>Error Reference: {error.digest}</span>}
                </div>
            </div>
        </div>
    );
}
