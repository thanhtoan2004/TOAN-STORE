import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// POST - Upload media for a review
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const reviewId = formData.get('reviewId') as string;
        const files = formData.getAll('media') as File[];

        if (!reviewId) {
            return NextResponse.json(
                { success: false, message: 'Missing reviewId' },
                { status: 400 }
            );
        }

        if (!files || files.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No files provided' },
                { status: 400 }
            );
        }

        // Verify review exists
        const review = await executeQuery<any[]>(
            'SELECT id FROM product_reviews WHERE id = ?',
            [parseInt(reviewId)]
        );

        if (!review || review.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Review not found' },
                { status: 404 }
            );
        }

        const uploadedMedia = [];
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reviews');

        // Create upload directory if it doesn't exist
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        for (const file of files) {
            // Validate file
            const validationResult = validateFile(file);
            if (!validationResult.valid) {
                return NextResponse.json(
                    { success: false, message: validationResult.error },
                    { status: 400 }
                );
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const ext = path.extname(file.name);
            const filename = `review_${reviewId}_${timestamp}_${randomString}${ext}`;
            const filepath = path.join(uploadDir, filename);

            // Save file
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filepath, buffer);

            // Determine media type
            const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
            const mediaUrl = `/uploads/reviews/${filename}`;

            // Insert into database
            await executeQuery(
                `INSERT INTO review_media (review_id, media_type, media_url, file_size, mime_type, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    parseInt(reviewId),
                    mediaType,
                    mediaUrl,
                    file.size,
                    file.type,
                    uploadedMedia.length
                ]
            );

            uploadedMedia.push({
                url: mediaUrl,
                type: mediaType,
                size: file.size
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Media uploaded successfully',
            data: uploadedMedia
        });
    } catch (error) {
        console.error('Error uploading media:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Helper function to validate file
function validateFile(file: File): { valid: boolean; error?: string } {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB

    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
        return {
            valid: false,
            error: 'Invalid file type. Allowed: JPG, PNG, WEBP, MP4, WEBM'
        };
    }

    if (isImage && file.size > maxImageSize) {
        return {
            valid: false,
            error: 'Image size must be less than 5MB'
        };
    }

    if (isVideo && file.size > maxVideoSize) {
        return {
            valid: false,
            error: 'Video size must be less than 50MB'
        };
    }

    return { valid: true };
}
