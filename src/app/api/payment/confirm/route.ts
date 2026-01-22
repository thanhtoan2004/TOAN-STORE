import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { executeQuery } from '@/lib/db/mysql';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function confirmPaymentHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    
    const orderNumber = formData.get('orderNumber')?.toString();
    const amount = formData.get('amount')?.toString();
    const phoneNumber = formData.get('phoneNumber')?.toString();
    const transactionNote = formData.get('transactionNote')?.toString() || '';
    const paymentProof = formData.get('paymentProof') as File | null;

    if (!orderNumber || !amount || !phoneNumber) {
      return createErrorResponse('Vui lòng điền đầy đủ thông tin bắt buộc', 400);
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return createErrorResponse('Số tiền không hợp lệ', 400);
    }

    const phoneRegex = /^(0|\+84)[3-9]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return createErrorResponse('Số điện thoại không hợp lệ', 400);
    }

    const orders = await executeQuery(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    ) as any[];

    if (orders.length === 0) {
      return createErrorResponse('Không tìm thấy đơn hàng', 404);
    }

    const order = orders[0];

    if (order.status === 'paid' || order.status === 'confirmed') {
      return createErrorResponse('Đơn hàng đã được thanh toán', 400);
    }

    if (order.status === 'cancelled') {
      return createErrorResponse('Đơn hàng đã bị hủy', 400);
    }

    const expectedAmount = parseFloat(order.total_amount);
    const amountDifference = Math.abs(paymentAmount - expectedAmount);
    const tolerance = 1000;

    if (amountDifference > tolerance) {
      return createErrorResponse(
        `Số tiền không khớp. Đơn hàng yêu cầu: ${expectedAmount.toLocaleString('vi-VN')}₫, bạn đã chuyển: ${paymentAmount.toLocaleString('vi-VN')}₫`,
        400
      );
    }

    let proofPath = null;
    if (paymentProof && paymentProof.size > 0) {
      try {
        const bytes = await paymentProof.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (paymentProof.size > 5 * 1024 * 1024) {
          return createErrorResponse('File ảnh quá lớn (tối đa 5MB)', 400);
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(paymentProof.type)) {
          return createErrorResponse('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)', 400);
        }

        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payment-proofs');
        await mkdir(uploadsDir, { recursive: true });

        const timestamp = Date.now();
        const fileExtension = paymentProof.name.split('.').pop();
        const filename = `${orderNumber}_${timestamp}.${fileExtension}`;
        proofPath = `/uploads/payment-proofs/${filename}`;

        await writeFile(join(uploadsDir, filename), buffer);
      } catch (error) {
        console.error('Error saving payment proof:', error);
      }
    }

    await executeQuery(
      `UPDATE orders 
       SET status = 'pending_payment_confirmation',
           payment_method = 'Ví MoMo',
           payment_confirmed_at = NOW(),
           notes = CONCAT(COALESCE(notes, ''), '\n[Xác nhận thanh toán] SĐT: ${phoneNumber}, Số tiền: ${paymentAmount.toLocaleString('vi-VN')}₫${transactionNote ? ', Ghi chú: ' + transactionNote : ''}${proofPath ? ', Ảnh: ' + proofPath : ''}')
       WHERE id = ?`,
      [order.id]
    );

    return createSuccessResponse(
      {
        orderNumber,
        amount: paymentAmount,
        status: 'pending_confirmation'
      },
      'Xác nhận thanh toán thành công! Đơn hàng sẽ được xử lý trong vòng 1-2 giờ làm việc.'
    );
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return createErrorResponse('Đã xảy ra lỗi khi xác nhận thanh toán', 500);
  }
}

export const POST = withErrorHandling(confirmPaymentHandler);

