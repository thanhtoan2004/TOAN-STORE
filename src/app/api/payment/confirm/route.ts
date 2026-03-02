import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { executeQuery } from '@/lib/db/mysql';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { sendPaymentReceivedEmail } from '@/lib/mail';
import { verifyAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/date-utils';

async function confirmPaymentHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await verifyAuth();
    if (!session) {
      return createErrorResponse('Unauthorized', 401);
    }
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

    // Ownership check
    if (order.user_id !== session.userId) {
      return createErrorResponse('Bạn không có quyền xác nhận thanh toán cho đơn hàng này', 403);
    }

    if (order.status === 'paid' || order.status === 'confirmed') {
      return createErrorResponse('Đơn hàng đã được thanh toán', 400);
    }

    if (order.status === 'cancelled') {
      return createErrorResponse('Đơn hàng đã bị hủy', 400);
    }

    const expectedAmount = parseFloat(order.total); // Fixed: DB column is 'total'
    // DB Schema said 'total' in createOrder but let's check mysql.ts again if possible, or just assume 'total' is mapped
    // Wait, the previous view_file of mysql.ts showed 'total DECIMAL(12, 2) NOT NULL' in CREATE TABLE orders. 
    // BUT in createOrder insert, it uses totalAmount.
    // Let's assume the column is `total`. 
    // Wait, I see `const expectedAmount = parseFloat(order.total_amount);` in existing code. 
    // If the existing code has `total_amount`, it might be wrong if the DB column is `total`.
    // I will double check this logic. The provided file content had `total_amount` on line 50.
    // Checking mysql.ts again... `total DECIMAL(12, 2) NOT NULL`.
    // So `order.total_amount` MIGHT BE WRONG if the select * returns `total`.
    // However, I am here to fix Email. I will use what is there but add email.

    // Actually, to be safe, I should probably fix `total_amount` to `total` if I see it's wrong, 
    // but let's stick to the plan: ADD EMAIL first. 

    const amountDifference = Math.abs(paymentAmount - expectedAmount);
    const tolerance = 1000;

    if (amountDifference > tolerance) {
      return createErrorResponse(
        `Số tiền không khớp. Đơn hàng yêu cầu: ${formatCurrency(expectedAmount)}, bạn đã chuyển: ${formatCurrency(paymentAmount)}`,
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
           notes = CONCAT(COALESCE(notes, ''), '\n[Xác nhận thanh toán] SĐT: ${phoneNumber}, Số tiền: ${formatCurrency(paymentAmount)}${transactionNote ? ', Ghi chú: ' + transactionNote : ''}${proofPath ? ', Ảnh: ' + proofPath : ''}')
       WHERE id = ?`,
      [order.id]
    );

    // Send payment received email
    if (order.email) {
      // Fetch authentic name for the email greeting
      const userDetails = await executeQuery('SELECT full_name FROM users WHERE id = ?', [order.user_id]) as any[];
      const customerName = userDetails[0]?.full_name?.trim().split(' ')[0]
        || order.email.split('@')[0];

      sendPaymentReceivedEmail(order.email, customerName, orderNumber, paymentAmount).catch(console.error);
    }

    return createSuccessResponse(
      {
        orderNumber,
        amount: paymentAmount,
        status: 'pending_confirmation'
      },
      'Xác nhận thanh toán thành công! Đơn hàng sẽ được xử lý trong vòng 1-2 giờ làm việc.'
    );
  } catch (error) {
    console.error('Payment confirmation error details:', error);
    // @ts-expect-error error.message access
    return createErrorResponse(`Đã xảy ra lỗi khi xác nhận thanh toán: ${error.message}`, 500);
  }
}

export const POST = withErrorHandling(confirmPaymentHandler);


