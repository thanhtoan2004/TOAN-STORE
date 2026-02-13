import { NextResponse } from 'next/server';

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
