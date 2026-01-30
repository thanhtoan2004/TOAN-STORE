'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import Image from 'next/image';

interface ReviewMediaUploadProps {
    onMediaChange: (files: File[]) => void;
    maxImages?: number;
    maxVideos?: number;
}

export default function ReviewMediaUpload({
    onMediaChange,
    maxImages = 5,
    maxVideos = 1
}: ReviewMediaUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<string[]>([]);

    const validateFile = (file: File): string | null => {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
        const maxImageSize = 5 * 1024 * 1024; // 5MB
        const maxVideoSize = 50 * 1024 * 1024; // 50MB

        const isImage = allowedImageTypes.includes(file.type);
        const isVideo = allowedVideoTypes.includes(file.type);

        if (!isImage && !isVideo) {
            return 'Định dạng file không hợp lệ. Chỉ chấp nhận: JPG, PNG, WEBP, MP4, WEBM';
        }

        if (isImage && file.size > maxImageSize) {
            return 'Kích thước ảnh phải nhỏ hơn 5MB';
        }

        if (isVideo && file.size > maxVideoSize) {
            return 'Kích thước video phải nhỏ hơn 50MB';
        }

        // Check count limits
        const currentImages = selectedFiles.filter(f => f.type.startsWith('image/')).length;
        const currentVideos = selectedFiles.filter(f => f.type.startsWith('video/')).length;

        if (isImage && currentImages >= maxImages) {
            return `Chỉ được upload tối đa ${maxImages} ảnh`;
        }

        if (isVideo && currentVideos >= maxVideos) {
            return `Chỉ được upload tối đa ${maxVideos} video`;
        }

        return null;
    };

    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files) return;

        const newErrors: string[] = [];
        const newFiles: File[] = [];
        const newPreviews: { [key: string]: string } = { ...previewUrls };

        Array.from(files).forEach(file => {
            const error = validateFile(file);
            if (error) {
                newErrors.push(`${file.name}: ${error}`);
            } else {
                newFiles.push(file);
                // Create preview URL
                const url = URL.createObjectURL(file);
                newPreviews[file.name] = url;
            }
        });

        setErrors(newErrors);

        if (newFiles.length > 0) {
            const updatedFiles = [...selectedFiles, ...newFiles];
            setSelectedFiles(updatedFiles);
            setPreviewUrls(newPreviews);
            onMediaChange(updatedFiles);
        }
    }, [selectedFiles, previewUrls, onMediaChange]);

    const removeFile = (fileName: string) => {
        const updatedFiles = selectedFiles.filter(f => f.name !== fileName);

        // Revoke preview URL to free memory
        if (previewUrls[fileName]) {
            URL.revokeObjectURL(previewUrls[fileName]);
        }

        const newPreviews = { ...previewUrls };
        delete newPreviews[fileName];

        setSelectedFiles(updatedFiles);
        setPreviewUrls(newPreviews);
        onMediaChange(updatedFiles);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
            >
                <input
                    type="file"
                    id="media-upload"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                        Kéo thả file vào đây hoặc click để chọn
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        Ảnh: JPG, PNG, WEBP (tối đa 5MB, {maxImages} ảnh)
                        <br />
                        Video: MP4, WEBM (tối đa 50MB, {maxVideos} video)
                    </p>
                </label>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800">Lỗi upload:</p>
                    <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Preview Grid */}
            {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {selectedFiles.map((file) => (
                        <div key={file.name} className="relative group">
                            {file.type.startsWith('image/') ? (
                                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    <Image
                                        src={previewUrls[file.name]}
                                        alt={file.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                        <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                                    <video
                                        src={previewUrls[file.name]}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                        <Video className="text-white" />
                                    </div>
                                </div>
                            )}

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeFile(file.name)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* File Info */}
                            <div className="mt-1 text-xs text-gray-600 truncate" title={file.name}>
                                {file.name}
                            </div>
                            <div className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
