'use client';

import React, { useState } from 'react';
import { Facebook, Twitter, Pin as Pinterest, Link as LinkIcon, Check } from 'lucide-react';

interface SocialShareProps {
    productName: string;
}

export default function SocialShare({ productName }: SocialShareProps) {
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`Xem ngay: ${productName} tại Nike Clone Store!`);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLinks = [
        {
            name: 'Facebook',
            icon: Facebook,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: 'hover:text-blue-600'
        },
        {
            name: 'Twitter',
            icon: Twitter,
            url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
            color: 'hover:text-sky-500'
        },
        {
            name: 'Pinterest',
            icon: Pinterest,
            url: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
            color: 'hover:text-red-600'
        }
    ];

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Chia sẻ:</span>
            <div className="flex gap-2">
                {shareLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-full border border-gray-200 text-gray-400 transition-all duration-300 hover:border-black ${link.color} hover:scale-110`}
                        title={`Chia sẻ lên ${link.name}`}
                    >
                        <link.icon className="w-5 h-5" />
                    </a>
                ))}
                <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-full border border-gray-200 text-gray-400 transition-all duration-300 hover:border-black hover:text-black hover:scale-110 relative ${copied ? 'border-green-500 text-green-500' : ''}`}
                    title="Sao chép liên kết"
                >
                    {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                    {copied && (
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded whitespace-nowrap animate-in fade-in slide-in-from-bottom-1">
                            Đã sao chép!
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
