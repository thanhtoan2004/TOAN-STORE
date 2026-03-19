import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import {
  createRefundRequest,
  getRefundByOrder,
  getUserRefunds,
} from '@/lib/db/repositories/refund';
import { ResponseWrapper } from '@/lib/api/api-response';

// GET: Get list of refunds for logged-in user
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return ResponseWrapper.unauthorized();
    }

    const refunds = await getUserRefunds(auth.userId);
    return ResponseWrapper.success({ refunds });
  } catch (error: any) {
    console.error('Get Refunds Error:', error);
    return ResponseWrapper.serverError(error.message, error);
  }
}

// POST: Create a new refund request
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { orderId, amount, reason, images } = body;

    if (!orderId || !reason || !amount) {
      return ResponseWrapper.error('Missing required fields', 400);
    }

    // 1. Verify Order belongs to user AND is delivered
    const [order] = await db
      .select({ id: ordersTable.id, status: ordersTable.status, userId: ordersTable.userId })
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (!order) {
      return ResponseWrapper.error('Order not found', 404);
    }

    if (order.userId !== auth.userId) {
      return ResponseWrapper.forbidden('Unauthorized order access');
    }

    if (order.status !== 'delivered') {
      return ResponseWrapper.error(
        'Chỉ đơn hàng đã giao thành công mới được yêu cầu hoàn tiền.',
        400
      );
    }

    // 2. Check if refund already exists
    const existingRefund = await getRefundByOrder(orderId);
    if (existingRefund) {
      return ResponseWrapper.error('Đơn hàng này đã có yêu cầu hoàn tiền đang xử lý.', 400);
    }

    // 3. Create Refund Request
    const refundId = await createRefundRequest(auth.userId, orderId, amount, reason, images || []);

    return ResponseWrapper.success({ refundId }, 'Gửi yêu cầu hoàn tiền thành công!');
  } catch (error: any) {
    console.error('Create Refund Error:', error);
    return ResponseWrapper.serverError(error.message, error);
  }
}
