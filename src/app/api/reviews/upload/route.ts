import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { verifyAuth } from '@/lib/auth';

const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_VIDEO_TYPES = ['.mp4', '.webm', '.mov'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
    try {
        // 1. Authentication Check
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const ext = path.extname(file.name).toLowerCase();
        let mediaType = 'image';

        // 2. Strict Type & Size Validation
        const ALLOWED_MIME_TYPES = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'video/mp4', 'video/webm', 'video/quicktime'
        ];

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'File type not allowed' }, { status: 400 });
        }

        if (file.type.startsWith('image/')) {
            if (file.size > MAX_IMAGE_SIZE) {
                return NextResponse.json({ success: false, error: 'Image too large (max 5MB)' }, { status: 400 });
            }
            if (!ALLOWED_IMAGE_TYPES.includes(ext)) {
                return NextResponse.json({ success: false, error: 'Invalid image extension' }, { status: 400 });
            }
            mediaType = 'image';
        } else if (file.type.startsWith('video/')) {
            if (file.size > MAX_VIDEO_SIZE) {
                return NextResponse.json({ success: false, error: 'Video too large (max 50MB)' }, { status: 400 });
            }
            if (!ALLOWED_VIDEO_TYPES.includes(ext)) {
                return NextResponse.json({ success: false, error: 'Invalid video extension' }, { status: 400 });
            }
            mediaType = 'video';
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 3. Save File
        // 3. Save File (Use UUID for safety)
        const randomString = crypto.randomUUID();
        const filename = `${Date.now()}-${randomString}${ext}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/reviews');

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (error) {
            // Ignore if exists
        }

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const mediaUrl = `/uploads/reviews/${filename}`;

        return NextResponse.json({
            success: true,
            data: {
                url: mediaUrl,
                type: mediaType,
                size: file.size
            }
        });

    } catch (error) {
        console.error('Review upload error:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
