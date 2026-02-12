import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

// Ensure news table exists
async function ensureNewsTable() {
    await executeQuery(`
    CREATE TABLE IF NOT EXISTS news (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      excerpt TEXT,
      content LONGTEXT NOT NULL,
      image_url VARCHAR(500),
      category VARCHAR(100),
      author_id BIGINT UNSIGNED,
      published_at TIMESTAMP NULL,
      is_published BOOLEAN DEFAULT 0,
      views INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// GET - List all news (admin)
export async function GET(request: NextRequest) {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await ensureNewsTable();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const publishedFilter = searchParams.get('published') || '';

        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams: any[] = [];

        if (search) {
            whereConditions.push('(title LIKE ? OR excerpt LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            whereConditions.push('category = ?');
            queryParams.push(category);
        }

        if (publishedFilter === 'published') {
            whereConditions.push('is_published = 1');
        } else if (publishedFilter === 'draft') {
            whereConditions.push('is_published = 0');
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const news = await executeQuery(`
      SELECT 
        n.*,
        CONCAT(u.first_name, ' ', u.last_name) as author_name
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

        const [countRow] = await executeQuery(`
      SELECT COUNT(*) as total FROM news n ${whereClause}
    `, queryParams) as any[];

        const total = countRow?.total || 0;

        return NextResponse.json({
            success: true,
            data: {
                news,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json({ success: false, message: 'Error fetching news' }, { status: 500 });
    }
}

// POST - Create news
export async function POST(request: NextRequest) {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await ensureNewsTable();

        const body = await request.json();
        const { title, excerpt, content, image_url, category, is_published } = body;

        if (!title || !content) {
            return NextResponse.json({ success: false, message: 'Title and content are required' }, { status: 400 });
        }

        // Generate slug from title
        const slug = title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const published_at = is_published ? new Date() : null;

        const result = await executeQuery(`
      INSERT INTO news (title, slug, excerpt, content, image_url, category, author_id, is_published, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, slug, excerpt, content, image_url, category, admin.userId, is_published ? 1 : 0, published_at]) as any;

        return NextResponse.json({
            success: true,
            message: 'News created successfully',
            data: { id: result.insertId }
        });
    } catch (error: any) {
        console.error('Error creating news:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ success: false, message: 'A news article with this title already exists' }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: 'Error creating news' }, { status: 500 });
    }
}
