import Image, { ImageProps } from 'next/image';
import cloudinaryLoader from '@/lib/cloudinary-loader';

interface OptimizedImageProps extends Omit<ImageProps, 'loader'> {
    // Add any Cloudinary specific props here if needed
}

/**
 * OptimizedImage component that automatically uses Cloudinary transformations.
 * Use this instead of next/image for any images hosted on Cloudinary or external sources
 * that we want to optimize via Cloudinary Fetch API (if configured).
 */
export default function OptimizedImage({ alt, ...props }: OptimizedImageProps) {
    return (
        <Image
            alt={alt}
            {...props}
            loader={cloudinaryLoader}
        />
    );
}
