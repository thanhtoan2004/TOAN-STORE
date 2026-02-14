/**
 * Image Service abstraction for TOAN
 * Handles image delivery, optimization hints, and provider switching (CDN/S3/Local)
 */

interface ImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
}

class ImageService {
    private static instance: ImageService;
    private provider: 'local' | 'cloudinary' | 's3' = 'local';

    private constructor() {
        // In a real app, this would be set by environment variables
        // process.env.IMAGE_PROVIDER as 'local' | 'cloudinary' | 's3';
    }

    static getInstance(): ImageService {
        if (!this.instance) {
            this.instance = new ImageService();
        }
        return this.instance;
    }

    /**
     * Get optimized image URL
     */
    getUrl(path: string, options: ImageOptions = {}): string {
        if (!path) return '/images/placeholder.png';
        if (path.startsWith('http')) return path;

        switch (this.provider) {
            case 'cloudinary':
                return this.getCloudinaryUrl(path, options);
            case 's3':
                return this.getS3Url(path);
            case 'local':
            default:
                return path.startsWith('/') ? path : `/${path}`;
        }
    }

    private getCloudinaryUrl(path: string, options: ImageOptions): string {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        if (!cloudName) return path;

        // Example transformation: c_scale,w_500,q_auto,f_webp
        const transformations = [];
        if (options.width) transformations.push(`w_${options.width}`);
        if (options.height) transformations.push(`h_${options.height}`);
        transformations.push(`q_${options.quality || 'auto'}`);
        transformations.push(`f_${options.format || 'auto'}`);

        return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join(',')}/${path}`;
    }

    private getS3Url(path: string): string {
        const bucket = process.env.AWS_S_BUCKET;
        const region = process.env.AWS_REGION;
        if (!bucket || !region) return path;

        return `https://${bucket}.s3.${region}.amazonaws.com/${path}`;
    }
}

export const imageService = ImageService.getInstance();
