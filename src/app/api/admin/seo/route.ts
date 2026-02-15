import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getSeoMetadata, upsertSeoMetadata, deleteSeoMetadata } from '@/lib/db/repositories/seo';

export async function GET(request: Request) {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any;
    const id = parseInt(searchParams.get('id') || '0');

    if (!type || !id) {
        return NextResponse.json({ success: false, message: 'Missing type or id' }, { status: 400 });
    }

    try {
        const metadata = await getSeoMetadata(type, id);
        return NextResponse.json({ success: true, metadata });
    } catch (error) {
        console.error('SEO Get Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const result = await upsertSeoMetadata(body);
        return NextResponse.json({ success: result });
    } catch (error) {
        console.error('SEO Upsert Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any;
    const id = parseInt(searchParams.get('id') || '0');

    try {
        const result = await deleteSeoMetadata(type, id);
        return NextResponse.json({ success: result });
    } catch (error) {
        console.error('SEO Delete Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
