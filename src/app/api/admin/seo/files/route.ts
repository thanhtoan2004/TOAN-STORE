import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import fs from 'fs';
import path from 'path';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý file SEO (Sitemap & Robots.txt).
 */

const PUBLIC_DIR = path.join(process.cwd(), 'public');

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'robots'; // robots or sitemap

    const fileName = type === 'robots' ? 'robots.txt' : 'sitemap.xml';
    const filePath = path.join(PUBLIC_DIR, fileName);

    let content = '';
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf-8');
    } else if (type === 'robots') {
      content = 'User-agent: *\nAllow: /';
    } else {
      content =
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>';
    }

    const result = {
      content,
      type,
    };

    return ResponseWrapper.success(result);
  } catch (error: any) {
    console.error('SEO File GET Error:', error);
    return ResponseWrapper.serverError('Lỗi server khi tải file SEO', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth) {
      return ResponseWrapper.unauthorized();
    }

    const { type, content } = await req.json();
    if (!type || !content) {
      return ResponseWrapper.error('Thiếu dữ liệu (type hoặc content)', 400);
    }

    const fileName = type === 'robots' ? 'robots.txt' : 'sitemap.xml';
    const filePath = path.join(PUBLIC_DIR, fileName);

    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf-8');

    return ResponseWrapper.success(null, `${fileName} updated successfully`);
  } catch (error: any) {
    console.error('SEO File POST Error:', error);
    return ResponseWrapper.serverError('Lỗi server khi cập nhật file SEO', error);
  }
}
