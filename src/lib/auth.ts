import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { executeQuery } from './db/mysql';

export interface JWTPayload {
    userId: number;
    email: string;
    roleId?: number;
    role: string;
    is_admin: boolean | number;
    exp: number;
}

// FIX L1: Throw error in production if JWT_SECRET is missing (lazy to avoid build-time crash)
export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production!');
    return 'dev_fallback_secret_not_for_production';
}
export const AUTH_TOKEN = 'nike_auth_session';
export const ADMIN_TOKEN = 'nike_admin_session';
export const REFRESH_TOKEN = 'nike_refresh_token';

// Token expiration times
export const ACCESS_TOKEN_EXP = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXP = '7d';  // 7 days

import { db } from './db/drizzle';
import { adminUsers } from './db/schema';
import { eq } from 'drizzle-orm';

/**
 * Verify and return admin authentication status
 * Used in Server Components and Route Handlers
 */
export async function checkAdminAuth() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(ADMIN_TOKEN)?.value;

        if (!token) return null;

        const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;

        // DB Verification for status and still being admin
        const admins = await db.select({
            id: adminUsers.id,
            isActive: adminUsers.isActive,
            roleId: adminUsers.roleId
        })
            .from(adminUsers)
            .where(eq(adminUsers.id, decoded.userId))
            .limit(1);

        if (admins.length === 0 || !admins[0].isActive) {
            return null;
        }

        // Attach updated roleId from DB
        decoded.roleId = admins[0].roleId ?? undefined;

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

        const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;

        // DB Verification for active status
        const users = await executeQuery(
            'SELECT id, is_active FROM users WHERE id = ? AND is_banned = 0 AND deleted_at IS NULL',
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

/**
 * Generate a short-lived Access Token
 */
export function generateAccessToken(payload: Partial<JWTPayload>): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXP });
}

/**
 * Generate a long-lived Refresh Token
 */
export function generateRefreshToken(payload: Partial<JWTPayload>): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: REFRESH_TOKEN_EXP });
}

/**
 * Verify a Refresh Token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, getJwtSecret()) as JWTPayload;
    } catch (error) {
        return null;
    }
}
