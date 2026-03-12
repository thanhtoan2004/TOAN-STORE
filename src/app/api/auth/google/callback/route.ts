import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { executeQuery, pool } from '@/lib/db/mysql';
import { AUTH_TOKEN } from '@/lib/auth/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=OAuthCodeMissing', baseUrl));
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Google Token Error:', tokenData);
      return NextResponse.redirect(new URL('/sign-in?error=OAuthTokenError', baseUrl));
    }

    // 2. Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect(new URL('/sign-in?error=NoEmailFromGoogle', baseUrl));
    }

    // 3. Check if user exists in DB
    const [existingUsers]: any = await executeQuery('SELECT * FROM users WHERE email = ?', [
      googleUser.email,
    ]);

    let userId;
    if (existingUsers && existingUsers.length > 0) {
      const user = existingUsers[0];
      userId = user.id;

      // Update google_id if not set
      if (!user.google_id) {
        await executeQuery('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?', [
          googleUser.id,
          googleUser.picture,
          user.id,
        ]);
      }
    } else {
      // Create new user
      const result: any = await executeQuery(
        'INSERT INTO users (email, first_name, last_name, google_id, avatar_url, is_verified, is_active) VALUES (?, ?, ?, ?, ?, 1, 1)',
        [
          googleUser.email,
          googleUser.given_name || '',
          googleUser.family_name || '',
          googleUser.id,
          googleUser.picture,
        ]
      );
      userId = result.insertId;
    }

    // 4. Generate JWT session
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const token = jwt.sign({ userId, email: googleUser.email, role: 'user', tv: 0 }, jwtSecret, {
      expiresIn: '15m',
    });

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
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(new URL('/sign-in?error=InternalServerError', baseUrl));
  }
}
