
import crypto from 'crypto';
import querystring from 'querystring';
import { format } from 'date-fns';

interface VNPayConfig {
    tmnCode: string;
    hashSecret: string;
    url: string;
    returnUrl: string;
}

const config: VNPayConfig = {
    tmnCode: process.env.VNP_TMN_CODE || '',
    hashSecret: process.env.VNP_HASH_SECRET || '',
    url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/api/payment/vnpay/return',
};

export const buildPaymentUrl = (orderId: string | number, amount: number, orderInfo: string, ipAddr: string = '127.0.0.1'): string => {
    const date = new Date();
    const createDate = format(date, 'yyyyMMddHHmmss');
    const expireDate = format(new Date(date.getTime() + 15 * 60 * 1000), 'yyyyMMddHHmmss'); // 15 mins expiry

    const vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = config.tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId.toString();
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPay uses input * 100
    vnp_Params['vnp_ReturnUrl'] = config.returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    const sortedParams = sortObject(vnp_Params);

    // Manual stringify to control encoding match VNPay requirements
    const signData = Object.keys(sortedParams)
        .map(key => `${key}=${sortedParams[key]}`)
        .join('&');

    const hmac = crypto.createHmac("sha512", config.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    sortedParams['vnp_SecureHash'] = signed;

    // For final URL, we need to stringify again
    const finalQuery = Object.keys(sortedParams)
        .map(key => `${key}=${sortedParams[key]}`)
        .join('&');

    return `${config.url}?${finalQuery}`;
};

export const verifyReturnUrl = (query: any) => {
    const secureHash = query['vnp_SecureHash'];
    const queryClone = { ...query };
    delete queryClone['vnp_SecureHash'];
    delete queryClone['vnp_SecureHashType'];

    const sortedParams = sortObject(queryClone);
    const signData = Object.keys(sortedParams)
        .map(key => `${key}=${sortedParams[key]}`)
        .join('&');

    const hmac = crypto.createHmac("sha512", config.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
        return {
            isSuccess: query['vnp_ResponseCode'] === '00',
            orderId: query['vnp_TxnRef'],
            amount: parseInt(query['vnp_Amount']) / 100,
            transactionNo: query['vnp_TransactionNo'],
            responseCode: query['vnp_ResponseCode']
        };
    }
    return null; // Invalid signature
};

function sortObject(obj: any) {
    const sorted: any = {};
    const str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
