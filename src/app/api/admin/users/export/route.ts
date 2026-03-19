import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users as usersTable } from '@/lib/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Xuất danh sách người dùng (Khách hàng) ra file CSV.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        phone: usersTable.phone,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(isNull(usersTable.deletedAt))
      .orderBy(desc(usersTable.createdAt));

    const headers = [
      'User ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Status',
      'Created At',
    ];
    const csvRows = [
      headers.join(','),
      ...users.map((user) =>
        [
          user.id,
          `"${user.firstName || ''}"`,
          `"${user.lastName || ''}"`,
          `"${user.email}"`,
          `"${user.phone || ''}"`,
          user.isActive ? '"Active"' : '"Inactive"',
          `"${user.createdAt ? new Date(user.createdAt).toLocaleString() : ''}"`,
        ].join(',')
      ),
    ];

    const csvContent = '\ufeff' + csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="customers_export.csv"',
      },
    });
  } catch (error) {
    console.error('User Export Error:', error);
    return ResponseWrapper.serverError('Internal Server Error', error);
  }
}
