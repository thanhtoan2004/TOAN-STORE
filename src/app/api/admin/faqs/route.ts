import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { JWTPayload } from '@/types/auth';

// Middleware kiểm tra admin
async function checkAdminAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as JWTPayload;

    const users = await executeQuery(
      'SELECT is_admin FROM users WHERE id = ?',
      [decoded.userId]
    ) as any[];

    if (users.length === 0 || users[0].is_admin !== 1) return null;

    return { isAdmin: true, userId: decoded.userId };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const faqs = await executeQuery(
      `SELECT * FROM faqs ORDER BY position ASC, created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];

    const [countRow] = await executeQuery(`SELECT COUNT(*) as total FROM faqs`) as any[];
    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: faqs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching FAQs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { question, answer, category_id, position } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, message: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO faqs (question, answer, category_id, position, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [question, answer, category_id || 1, position || 0]
    ) as any;

    return NextResponse.json({
      success: true,
      message: 'FAQ created successfully',
      data: { id: result.insertId, question, answer, category_id, position }
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating FAQ' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, question, answer, category_id, position, is_active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }

    await executeQuery(
      `UPDATE faqs SET question = ?, answer = ?, category_id = ?, position = ?, is_active = ?, updated_at = NOW() 
       WHERE id = ?`,
      [question, answer, category_id || 1, position || 0, is_active !== undefined ? (is_active ? 1 : 0) : 1, id]
    );

    return NextResponse.json({
      success: true,
      message: 'FAQ updated successfully'
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating FAQ' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }

    await executeQuery(`DELETE FROM faqs WHERE id = ?`, [id]);

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting FAQ' },
      { status: 500 }
    );
  }
}
