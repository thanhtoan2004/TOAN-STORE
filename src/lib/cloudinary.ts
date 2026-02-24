import { v2 as cloudinary } from 'cloudinary';

/**
 * Cấu hình Cloudinary (Cloud Object Storage for APIs).
 * Vì Next.js / Node.js lưu file lên ổ cứng (File System) sẽ bị dọn dẹp mất hết dữ liệu nếu Server khởi động lại (VD: trên Vercel / Heroku).
 * Việc sử dụng Cloudinary giúp ảnh được up lên hạ tầng CDN độc lập, load nhanh vô tận trên toàn cầu và bảo toàn dữ liệu.
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

console.log(`[SERVICE_INITIALIZATION] Cloudinary configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);

/**
 * Hàm push file tĩnh (Base64 hoặc link tạm) lên tài khoản Cloudinary.
 * Trả về 1 object chứa chuỗi `secure_url` (Link CDN) để paste vào CSDL MySQL.
 */
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
