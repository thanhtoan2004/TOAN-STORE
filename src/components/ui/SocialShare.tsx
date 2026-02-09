"use client";
import { Facebook, Twitter, Link as LinkIcon, Mail } from "lucide-react";
import { useState } from "react";

interface SocialShareProps {
    url: string;
    title: string;
    description?: string;
    imageUrl?: string;
}

export default function SocialShare({ url, title, description, imageUrl }: SocialShareProps) {
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? window.location.origin + url : url;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description || '');

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        pinterest: imageUrl
            ? `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(imageUrl)}&description=${encodedTitle}`
            : null,
        email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = (platform: string) => {
        const link = shareLinks[platform as keyof typeof shareLinks];
        if (link) {
            window.open(link, '_blank', 'width=600,height=400');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Chia sẻ:</span>

            {/* Facebook */}
            <button
                onClick={() => handleShare('facebook')}
                className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                aria-label="Share on Facebook"
            >
                <Facebook size={20} />
            </button>

            {/* Twitter */}
            <button
                onClick={() => handleShare('twitter')}
                className="p-2 rounded-full hover:bg-sky-50 text-sky-500 transition-colors"
                aria-label="Share on Twitter"
            >
                <Twitter size={20} />
            </button>

            {/* Email */}
            <button
                onClick={() => handleShare('email')}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Share via Email"
            >
                <Mail size={20} />
            </button>

            {/* Copy Link */}
            <button
                onClick={copyToClipboard}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors relative"
                aria-label="Copy link"
            >
                <LinkIcon size={20} />
                {copied && (
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Đã sao chép!
                    </span>
                )}
            </button>
        </div>
    );
}
