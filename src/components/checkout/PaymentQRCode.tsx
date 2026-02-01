
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
    accountName = 'NIKE CLONE STORE',
    accountNumber = '113366668888', // Mock account number (MB Bank example)
    bankId = 'MB' // MB Bank
}: PaymentQRCodeProps) {
    // VietQR QuickLink format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<NAME>
    // Template: compact, qr_only, print. Default is compact.

    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNumber}-print.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

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
                <p><strong>Ngân hàng:</strong> MB Bank</p>
                <p><strong>Số tài khoản:</strong> {accountNumber}</p>
                <p><strong>Chủ tài khoản:</strong> {accountName}</p>
                <p><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</p>
                <p><strong>Nội dung:</strong> {description}</p>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                Lưu ý: Đây là mã demo. Không chuyển tiền thật!
            </div>
        </div>
    );
}
