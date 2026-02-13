
import { NextResponse } from 'next/server';
import { verifyReturnUrl } from '@/lib/payment/vnpay';
import { executeQuery } from '@/lib/db/mysql';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    try {
        const verify = verifyReturnUrl(query);

        if (!verify) {
            return NextResponse.redirect(new URL('/checkout/order-result?status=checksum_failed', request.url));
        }

        if (verify.isSuccess) {
            // Update transaction status (Optional, mostly relies on IPN)
            return NextResponse.redirect(new URL(`/checkout/order-result?status=success&orderId=${verify.orderId}`, request.url));
        } else {
            return NextResponse.redirect(new URL(`/checkout/order-result?status=failed&code=${verify.responseCode}`, request.url));
        }

    } catch (error) {
        console.error('VNPay Return Error:', error);
        return NextResponse.redirect(new URL('/checkout/order-result?status=error', request.url));
    }
}
