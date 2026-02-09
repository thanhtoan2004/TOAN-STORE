import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email-templates';

/**
 * API endpoint to send order confirmation email
 * Called after successful order placement
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderDetails } = body;

        if (!orderDetails) {
            return NextResponse.json({
                success: false,
                message: 'Order details are required'
            }, { status: 400 });
        }

        // Validate required fields
        const required = ['orderNumber', 'customerEmail', 'customerName', 'items', 'total', 'shippingAddress'];
        for (const field of required) {
            if (!orderDetails[field]) {
                return NextResponse.json({
                    success: false,
                    message: `Missing required field: ${field}`
                }, { status: 400 });
            }
        }

        // Send email
        const sent = await sendOrderConfirmationEmail(orderDetails);

        if (sent) {
            return NextResponse.json({
                success: true,
                message: 'Order confirmation email sent successfully'
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Failed to send email (SMTP not configured or error occurred)'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Send order email API error:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error'
        }, { status: 500 });
    }
}
