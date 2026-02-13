
import crypto from 'crypto';

interface MomoConfig {
    partnerCode: string;
    accessKey: string;
    secretKey: string;
    endpoint: string;
    redirectUrl: string;
    ipnUrl: string;
}

const config: MomoConfig = {
    partnerCode: process.env.MOMO_PARTNER_CODE || '',
    accessKey: process.env.MOMO_ACCESS_KEY || '',
    secretKey: process.env.MOMO_SECRET_KEY || '',
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/checkout/order-result',
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3000/api/payment/momo/ipn',
};

export const createMomoPayment = async (orderId: string | number, amount: number, orderInfo: string) => {
    const requestId = orderId + new Date().getTime().toString();
    const requestType = "captureWallet";
    const extraData = ""; // Pass empty string or base64 encoded JSON

    const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${config.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', config.secretKey)
        .update(rawSignature)
        .digest('hex');

    const requestBody = {
        partnerCode: config.partnerCode,
        accessKey: config.accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId.toString(),
        orderInfo: orderInfo,
        redirectUrl: config.redirectUrl,
        ipnUrl: config.ipnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'vi'
    };

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Momo Payment Creation Error:', error);
        throw error;
    }
};

export const verifyMomoSignature = (body: any) => {
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = body;

    const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const generatedSignature = crypto.createHmac('sha256', config.secretKey)
        .update(rawSignature)
        .digest('hex');

    return signature === generatedSignature;
};
