/**
 * Image Service abstraction for TOAN Store
 * Handles image delivery, optimization hints, and provider switching (CDN/S3/Local)
 */

export type ImagePreset =
  | 'THUMBNAIL'
  | 'PRODUCT_CARD'
  | 'PRODUCT_DETAIL'
  | 'HERO_BANNER'
  | 'ORIGINAL';

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'webp' | 'avif' | 'auto';
  preset?: ImagePreset;
}

const PRESETS: Record<ImagePreset, Partial<ImageOptions>> = {
  THUMBNAIL: { width: 150, height: 150, quality: 'auto' },
  PRODUCT_CARD: { width: 500, height: 500, quality: 'auto' },
  PRODUCT_DETAIL: { width: 1000, height: 1000, quality: 'auto' },
  HERO_BANNER: { width: 1920, quality: 'auto' },
  ORIGINAL: { quality: 'auto' },
};

class ImageService {
  private static instance: ImageService;
  private provider: 'local' | 'cloudinary' | 's3' = 'cloudinary'; // Default to cloudinary for production-ready state

  private constructor() {
    // Provider can be controlled via env in future if needed
    if (process.env.NEXT_PUBLIC_IMAGE_PROVIDER === 's3') {
      this.provider = 's3';
    } else if (process.env.NEXT_PUBLIC_IMAGE_PROVIDER === 'local') {
      this.provider = 'local';
    }
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
    if (!path) return '/placeholder.png';
    if (path.startsWith('http')) {
      // If already a Cloudinary URL but without transformations, we might want to inject them
      if (path.includes('res.cloudinary.com') && !path.includes('/upload/')) {
        // handle raw cloudinary URLs if any
      }
      return path;
    }

    // Apply preset if provided
    const finalOptions = options.preset ? { ...PRESETS[options.preset], ...options } : options;

    switch (this.provider) {
      case 'cloudinary':
        return this.getCloudinaryUrl(path, finalOptions);
      case 's3':
        return this.getS3Url(path);
      case 'local':
      default:
        return path.startsWith('/') ? path : `/${path}`;
    }
  }

  private getCloudinaryUrl(path: string, options: ImageOptions): string {
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return path;

    // Clean path (remove leading slash if exists)
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    const transformations = [];

    // Essential Cloudinary optimizations
    transformations.push(`q_${options.quality || 'auto'}`);
    transformations.push(`f_${options.format || 'auto'}`);

    if (options.width && options.height) {
      transformations.push(`c_fill,w_${options.width},h_${options.height}`);
    } else if (options.width) {
      transformations.push(`c_scale,w_${options.width}`);
    }

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join(',')}/${cleanPath}`;
  }

  private getS3Url(path: string): string {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) return path;

    return `https://${bucket}.s3.${region}.amazonaws.com/${path}`;
  }
}

export const imageService = ImageService.getInstance();
