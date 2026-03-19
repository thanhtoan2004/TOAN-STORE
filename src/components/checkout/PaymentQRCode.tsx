import React from 'react';
import Image from 'next/image';

interface PaymentQRCodeProps {
  amount: number;
  description: string;
  accountName?: string;
  accountNumber?: string;
  bankId?: string; // VietQR Bank ID (e.g., 970436 - Vietcombank, MB, etc.)
}

export default function PaymentQRCode({
  amount,
  description,
  accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'TOAN Store',
  accountNumber = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '113366668888',
  bankId = process.env.NEXT_PUBLIC_BANK_ID || 'MB',
}: PaymentQRCodeProps) {
  // SePay QuickLink format: https://qr.sepay.vn/img?acc=<STK>&bank=<BANK>&amount=<AMOUNT>&des=<DESCRIPTION>&accountName=<NAME>&api_key=<API_KEY>
  const qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankId}&amount=${amount}&des=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}&api_key=${process.env.NEXT_PUBLIC_SEPAY_API_TOKEN}`;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg">
      <div className="relative w-64 h-64 mb-4">
        <Image
          src={qrUrl}
          alt="Payment QR Code"
          fill
          className="object-contain"
          unoptimized // VietQR images might not be optimizable by Next.js default loader
        />
      </div>
      <p className="text-sm text-gray-500 mb-2">Quét mã để thanh toán</p>
      <div className="text-center text-sm">
        <p>
          <strong>Ngân hàng:</strong> MB Bank
        </p>
        <p>
          <strong>Số tài khoản:</strong> {accountNumber}
        </p>
        <p>
          <strong>Chủ tài khoản:</strong> {accountName}
        </p>
        <p>
          <strong>Số tiền:</strong>{' '}
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
        </p>
        <p>
          <strong>Nội dung:</strong> {description}
        </p>
      </div>
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
          Lưu ý: Đây là mã demo. Không chuyển tiền thật!
        </div>
      )}
    </div>
  );
}
