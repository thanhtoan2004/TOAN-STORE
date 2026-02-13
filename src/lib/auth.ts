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

// FIX L1: Throw error in production if JWT_SECRET is missing
const JWT_SECRET = process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production!');
    return 'dev_fallback_secret_not_for_production';
})();
export const AUTH_TOKEN = 'nike_auth_session';
export const ADMIN_TOKEN = 'nike_admin_session';
export const REFRESH_TOKEN = 'nike_refresh_token';

// Token expiration times
export const ACCESS_TOKEN_EXP = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXP = '7d';  // 7 days

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
        const admins = await executeQuery(
            'SELECT id, is_active FROM admin_users WHERE id = ?',
            [decoded.userId]
        ) as any[];

        if (admins.length === 0 || !admins[0].is_active) {
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
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXP });
}

/**
 * Generate a long-lived Refresh Token
 */
export function generateRefreshToken(payload: Partial<JWTPayload>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXP });
}

/**
 * Verify a Refresh Token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}
