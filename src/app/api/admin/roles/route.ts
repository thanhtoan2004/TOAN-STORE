import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { roles as rolesTable } from '@/lib/db/schema';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const roles = await db.select().from(rolesTable);

    return ResponseWrapper.success(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}
