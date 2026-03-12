import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth';
import {
  createRefundRequest,
  getRefundByOrder,
  getUserRefunds,
} from '@/lib/db/repositories/refund';
import { executeQuery } from '@/lib/db/mysql';

// GET: Get list of refunds for logged-in user
/**
 * API Lấy danh sách các yêu cầu hoàn tiền của người dùng hiện tại.
 */
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const refunds = await getUserRefunds(auth.userId);
    return NextResponse.json({ refunds });
  } catch (error: any) {
    console.error('Get Refunds Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST: Create a new refund request
/**
 * API Gửi yêu cầu hoàn tiền mới cho một đơn hàng.
 * Điều kiện:
 * 1. Đơn hàng phải thuộc về người dùng và có trạng thái 'delivered'.
 * 2. Đơn hàng chưa có yêu cầu hoàn tiền nào khác đang được xử lý.
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, amount, reason, images } = body;

    if (!orderId || !reason || !amount) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify Order belongs to user AND is delivered
    const orders = (await executeQuery('SELECT id, status, user_id FROM orders WHERE id = ?', [
      orderId,
    ])) as any[];

    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];
    if (order.user_id !== auth.userId) {
      return NextResponse.json({ message: 'Unauthorized order access' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return NextResponse.json(
        { message: 'Chỉ đơn hàng đã giao thành công mới được yêu cầu hoàn tiền.' },
        { status: 400 }
      );
    }

    // 2. Check if refund already exists
    const existingRefund = await getRefundByOrder(orderId);
    if (existingRefund) {
      return NextResponse.json(
        { message: 'Đơn hàng này đã có yêu cầu hoàn tiền đang xử lý.' },
        { status: 400 }
      );
    }

    // 3. Create Refund Request
    const refundId = await createRefundRequest(auth.userId, orderId, amount, reason, images || []);

    return NextResponse.json({
      success: true,
      message: 'Gửi yêu cầu hoàn tiền thành công!',
      refundId,
    });
  } catch (error: any) {
    console.error('Create Refund Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
