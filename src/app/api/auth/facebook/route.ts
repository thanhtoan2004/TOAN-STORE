import { NextResponse } from 'next/server';

/**
 * API Khởi tạo luồng đăng nhập bằng Facebook (OAuth2).
 * Chức năng: Chuyển hướng người dùng đến trang xác thực của Facebook để yêu cầu quyền truy cập email và hồ sơ công khai.
 */
export async function GET() {
    const rootUrl = 'https://www.facebook.com/v18.0/dialog/oauth';

    const options = {
        redirect_uri: process.env.FACEBOOK_CALLBACK_URL || '',
        client_id: process.env.FACEBOOK_APP_ID || '',
        state: '{st=state123abc,ds=123456789}', // Should be dynamic in production
        scope: ['email', 'public_profile'].join(','),
        response_type: 'code',
        auth_type: 'rerequest',
        display: 'popup',
    };

    const qs = new URLSearchParams(options);

    return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
