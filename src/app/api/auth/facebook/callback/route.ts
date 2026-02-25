import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/db/mysql';
import { AUTH_TOKEN } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!code) {
        return NextResponse.redirect(new URL('/sign-in?error=OAuthCodeMissing', baseUrl));
    }

    try {
        // 1. Exchange code for access token
        const tokenResponse = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?` +
            new URLSearchParams({
                client_id: process.env.FACEBOOK_APP_ID || '',
                client_secret: process.env.FACEBOOK_APP_SECRET || '',
                redirect_uri: process.env.FACEBOOK_CALLBACK_URL || '',
                code,
            })
        );

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('Facebook Token Error:', tokenData);
            return NextResponse.redirect(new URL('/sign-in?error=OAuthTokenError', baseUrl));
        }

        // 2. Get user info from Facebook Graph API
        const userResponse = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture.type(large)&access_token=${tokenData.access_token}`
        );

        const fbUser = await userResponse.json();

        if (!fbUser.email) {
            // Facebook users might not have email depending on permissions or account type
            return NextResponse.redirect(new URL('/sign-in?error=NoEmailFromFacebook', baseUrl));
        }

        // 3. Check if user exists in DB
        const [existingUsers]: any = await executeQuery('SELECT * FROM users WHERE email = ?', [fbUser.email]);

        let userId;
        let isAdmin = 0;

        if (existingUsers && existingUsers.length > 0) {
            const user = existingUsers[0];
            userId = user.id;
            isAdmin = user.is_admin || 0;

            // Update facebook_id if not set
            if (!user.facebook_id) {
                await executeQuery('UPDATE users SET facebook_id = ?, avatar_url = ? WHERE id = ?', [
                    fbUser.id,
                    fbUser.picture?.data?.url || null,
                    user.id,
                ]);
            }
        } else {
            // Create new user
            const result: any = await executeQuery(
                'INSERT INTO users (email, first_name, last_name, facebook_id, avatar_url, is_verified, is_active) VALUES (?, ?, ?, ?, ?, 1, 1)',
                [
                    fbUser.email,
                    fbUser.first_name || '',
                    fbUser.last_name || '',
                    fbUser.id,
                    fbUser.picture?.data?.url || null,
                ]
            );
            userId = result.insertId;
        }

        // 4. Generate JWT session
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured');
        }
        const token = jwt.sign(
            { userId, email: fbUser.email, is_admin: isAdmin, role: isAdmin ? 'admin' : 'user', tv: 0 },
            jwtSecret,
            { expiresIn: '15m' }
        );

        // 5. Set session cookie
        const cookieStore = await cookies();
        cookieStore.set(AUTH_TOKEN, token, {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'strict',
        });

        // 6. Success redirect
        return NextResponse.redirect(new URL('/', baseUrl));
    } catch (error) {
        console.error('Facebook OAuth Callback Error:', error);
        return NextResponse.redirect(new URL('/sign-in?error=InternalServerError', baseUrl));
    }
}
