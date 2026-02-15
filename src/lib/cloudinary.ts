import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

console.log(`[SERVICE_INITIALIZATION] Cloudinary configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);

export async function uploadImage(fileUri: string, folder: string = 'nike-clone') {
    try {
        const result = await cloudinary.uploader.upload(fileUri, {
            folder: folder,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto'
        });
        return result;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw error;
    }
}

export function getOptimizedUrl(publicId: string, options: any = {}) {
    return cloudinary.url(publicId, {
        quality: 'auto',
        fetch_format: 'auto',
        crop: 'fill',
        ...options
    });
}

export default cloudinary;
