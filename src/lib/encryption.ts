import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

let _encryptionKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
    if (_encryptionKey) return _encryptionKey;

    const rawKey = process.env.ENCRYPTION_KEY;
    if (!rawKey && process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY is required in production!');
    }
    const key = rawKey || 'default-secret-key-must-be-changed-in-production';
    _encryptionKey = crypto.createHash('sha256').update(key).digest();
    return _encryptionKey;
}

/**
 * Hàm Mã Hóa Dữ Liệu Thuật toán AES-256-GCM.
 * Dùng để bọc các dữ liệu Nhạy Cảm Cá Nhân (PII) như: Số điện thoại, Số nhà, Mã PIN Gift Card.
 * Đảm bảo kể cả Database Admin lộ DB SQL cũng không thể đọc được nội dung thực sự.
 * 
 * @param text Chuỗi văn bản gốc cần giấu
 * @returns Chuỗi định dạng `IV:AuthTag:EncryptedData`
 */
export function encrypt(text: string): string {
    if (!text) return text;

    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag().toString('hex');

        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error);
        // FIX M4: Throw instead of silently returning plaintext
        throw new Error('Failed to encrypt sensitive data');
    }
}

/**
 * Hàm Giải Mã AES-256-GCM.
 * Tách `IV`, `AuthTag` và `Data` ra từ chuỗi mã hóa để khôi phục lại dữ liệu gốc.
 * Lỗi giải mã sẽ được ngầm pass qua trả về chuỗi gốc (tránh crash khi gặp dữ liệu Legacy chưa mã hóa).
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

    try {
        const parts = encryptedText.split(':');
        if (parts.length < 3) return encryptedText;

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        // If decryption fails, it might be plain text
        return encryptedText;
    }
}
