import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { executeQuery } from './db/mysql';

export interface JWTPayload {
    userId: number;
    email: string;
    role: string;
    is_admin: boolean | number;
    exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
export const AUTH_TOKEN = 'nike_auth_session';
export const ADMIN_TOKEN = 'nike_admin_session';

/**
 * Verify and return admin authentication status
 * Used in Server Components and Route Handlers
 */
export async function checkAdminAuth() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(ADMIN_TOKEN)?.value;

        if (!token) return null;

        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

        // DB Verification for status and still being admin
        const users = await executeQuery(
            'SELECT id, is_admin, is_active FROM users WHERE id = ? AND is_banned = 0',
            [decoded.userId]
        ) as any[];

        if (users.length === 0 || !users[0].is_active || users[0].is_admin !== 1) {
            return null;
        }

        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Basic JWT verification for general users
 */
export async function verifyAuth() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN)?.value;

        if (!token) return null;

        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

        // DB Verification for active status
        const users = await executeQuery(
            'SELECT id, is_active FROM users WHERE id = ? AND is_banned = 0',
            [decoded.userId]
        ) as any[];

        if (users.length === 0 || !users[0].is_active) {
            return null;
        }

        return decoded;
    } catch (error) {
        return null;
    }
}
