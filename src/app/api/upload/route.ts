import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { verifyAuth } from '@/lib/auth';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

        // 2. Strict Type & Size Validation
        const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'File type not allowed (Images only)' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ success: false, error: 'File too large (max 5MB)' }, { status: 400 });
        }

        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json({ success: false, error: 'Invalid extension' }, { status: 400 });
        }

        // Double extension check
        if (file.name.split('.').length > 2) {
            return NextResponse.json({ success: false, error: 'Security alert: Multiple extensions detected' }, { status: 400 });
        }

        // SVG check
        if (ext === '.svg' || file.type.includes('svg')) {
            return NextResponse.json({ success: false, error: 'SVG files are not allowed' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 4. Safe Unique Filename (Use UUID)
        const randomString = crypto.randomUUID();
        const filename = `${Date.now()}-${randomString}${ext}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/chat');

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (error) {
            // Ignore error if directory exists
        }

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const imageUrl = `/uploads/chat/${filename}`;

        return NextResponse.json({ success: true, imageUrl });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
