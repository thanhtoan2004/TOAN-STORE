import { NextResponse } from 'next/server';

/**
 * API Khởi tạo luồng đăng nhập bằng Google (OAuth2).
 * Chức năng: Chuyển hướng người dùng đến trang xác thực của Google với các quyền (scopes) cần thiết.
 */
export async function GET() {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

    const options = {
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
    };

    const qs = new URLSearchParams(options);

    return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
