import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { executeQuery } from './db/mysql';

/**
 * Payload chứa thông tin nhúng bên trong chuỗi mã hóa JWT của mỗi người dùng.
 * Các thông tin này sẽ được đính theo Session (Cookie) và gửi lên server mỗi request.
 */
export interface JWTPayload {
    userId: number;
    email: string;
    roleId?: number;
    role: string;
    is_admin: boolean | number | string;

    /**
     * Dấu ấn bảo mật (Security Stamp / Token Version). 
     * Dùng để 'đá' lập tức user khỏi mọi thiết bị khi họ Đổi Mật Khẩu,
     * bằng cách update cột token_version ở database lệch đi so với số này.
     */
    tv: number;

    exp: number; // Thời gian hết hạn JWT
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
 * Xác minh tính hợp lệ của Token JWT gửi lên từ Cookie người dùng phổ thông (Customer).
 * Chức năng bảo mật quan trọng:
 * 1. Giải mã JWT bằng Secret Key.
 * 2. So sánh `token_version` (tv) trong JWT với `token_version` trong Database.
 * => Ngăn chặn Token bị lộ lọt tiếp tục sử dụng sau khi chủ tài khoản đổi lại Mật Khẩu.
 */
export async function verifyAuth() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN)?.value;

        if (!token) return null;

        const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;

        // Ensure decoded has token version
        if (typeof decoded.tv === 'undefined') return null;

        // DB Verification for active status AND token version
        const users = await executeQuery(
            'SELECT id, is_active, token_version FROM users WHERE id = ? AND is_banned = 0 AND deleted_at IS NULL',
            [decoded.userId]
        ) as any[];

        if (users.length === 0 || !users[0].is_active) {
            return null;
        }

        // Security check: Verify token version matches database
        if (decoded.tv !== users[0].token_version) {
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
