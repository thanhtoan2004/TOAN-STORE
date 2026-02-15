'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface AdminMediaUploadProps {
    onUploadComplete: (url: string, type: 'image' | 'video') => void;
    onRemove?: () => void;
    initialUrl?: string;
    initialType?: 'image' | 'video';
    label?: string;
    maxWidth?: string;
}

export default function AdminMediaUpload({
    onUploadComplete,
    onRemove,
    initialUrl,
    initialType = 'image',
    label = 'Upload Media',
    maxWidth = 'w-full'
}: AdminMediaUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>(initialType);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset state
        setError(null);
        setUploading(true);

        // Validation
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
            setError('File type not supported. Please upload an image or video.');
            setUploading(false);
            return;
        }

        const MAX_SIZE = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setError(`File too large. Max size is ${isVideo ? '50MB' : '5MB'}.`);
            setUploading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                const type = isVideo ? 'video' : 'image';
                setPreviewUrl(result.imageUrl);
                setMediaType(type);
                onUploadComplete(result.imageUrl, type);
            } else {
                setError(result.error || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload Error:', err);
            setError('An unexpected error occurred during upload.');
        } finally {
            setUploading(false);
            // Clear input
            e.target.value = '';
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        if (onRemove) onRemove();
    };

    return (
        <div className={`space-y-2 ${maxWidth}`}>
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>

            {!previewUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-black transition-colors bg-gray-50">
                    <div className="flex flex-col items-center justify-center text-center">
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <label className="cursor-pointer">
                                    <span className="text-black font-semibold hover:underline">Click to upload</span>
                                    <span className="text-gray-500"> or drag and drop</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </label>
                                <p className="text-xs text-gray-400 mt-1">
                                    Images (max 5MB) or Videos (max 50MB)
                                </p>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                    {mediaType === 'video' ? (
                        <div className="relative aspect-video w-full bg-black">
                            <video
                                src={previewUrl}
                                className="w-full h-full object-contain"
                                controls
                            />
                            <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
                                <Video className="w-3 h-3" /> Video
                            </div>
                        </div>
                    ) : (
                        <div className="relative aspect-video w-full">
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Image
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm transition-colors"
                        title="Remove"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
