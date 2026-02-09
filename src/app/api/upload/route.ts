import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
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
