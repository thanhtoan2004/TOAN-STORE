import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Fetch users (customers)
        const users = await executeQuery<any[]>(`
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        phone, 
        is_active, 
        created_at
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);

        // Generate CSV content
        const headers = ['User ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Created At'];
        const csvRows = [
            headers.join(','),
            ...users.map(user => [
                user.id,
                `"${user.first_name || ''}"`,
                `"${user.last_name || ''}"`,
                `"${user.email}"`,
                `"${user.phone || ''}"`,
                user.is_active ? '"Active"' : '"Inactive"',
                `"${new Date(user.created_at).toLocaleString()}"`
            ].join(','))
        ];

        const csvContent = "\ufeff" + csvRows.join('\n'); // Add BOM for UTF-8 support in Excel

        // Return as downloadable file
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="customers_export.csv"',
            },
        });
    } catch (error) {
        console.error('User Export Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
