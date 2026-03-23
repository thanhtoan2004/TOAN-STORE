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
        {/* TOAN Store Logo */}
        <div className="flex justify-center">
          <img
            src="/icons/icon-512x512.png"
            alt="TOAN Store"
            className="h-20 w-20 object-contain"
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight uppercase italic">
            Something went wrong
          </h1>
          <p className="text-gray-600">
            We're sorry for the inconvenience. Our team has been notified and we're working to fix
            the issue.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => reset()}
            className="w-full bg-black text-white rounded-full py-6 text-lg hover:bg-gray-800 transition-all font-medium"
          >
            Try again
          </Button>

          <Link
            href="/"
            className="w-full text-center py-4 text-sm font-semibold underline underline-offset-4 hover:text-gray-600 transition-colors"
          >
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
