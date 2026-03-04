import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Unit Tests cho Encryption Module (AES-256-GCM)
 * Kiểm tra mã hóa/giải mã hoạt động đúng và bảo mật.
 */

describe('Encryption Module (AES-256-GCM)', () => {
    describe('encrypt()', () => {
        it('should return encrypted string different from input', () => {
            const plaintext = 'Hello World 123';
            const encrypted = encrypt(plaintext);
            expect(encrypted).not.toBe(plaintext);
            expect(encrypted.length).toBeGreaterThan(plaintext.length);
        });

        it('should include IV separator (:)', () => {
            const encrypted = encrypt('test data');
            expect(encrypted).toContain(':');
        });

        it('should produce different ciphertext for same input (unique IV)', () => {
            const plaintext = 'same input data';
            const encrypted1 = encrypt(plaintext);
            const encrypted2 = encrypt(plaintext);
            // AES-GCM uses random IV, so same plaintext → different ciphertext
            expect(encrypted1).not.toBe(encrypted2);
        });

        it('should handle empty string', () => {
            const encrypted = encrypt('');
            expect(encrypted).toBeDefined();
            expect(typeof encrypted).toBe('string');
        });

        it('should handle Vietnamese characters', () => {
            const vietnamese = 'Xin chào Việt Nam 🇻🇳';
            const encrypted = encrypt(vietnamese);
            expect(encrypted).not.toBe(vietnamese);
        });

        it('should handle special characters', () => {
            const special = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
            const encrypted = encrypt(special);
            expect(encrypted).not.toBe(special);
        });
    });

    describe('decrypt()', () => {
        it('should correctly decrypt encrypted data', () => {
            const plaintext = 'Hello World 123';
            const encrypted = encrypt(plaintext);
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });

        it('should preserve Vietnamese characters', () => {
            const vietnamese = 'Nguyễn Thanh Toàn 0901234567';
            const encrypted = encrypt(vietnamese);
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(vietnamese);
        });

        it('should handle long text', () => {
            const longText = 'Số 123, Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM, Việt Nam - Mã bưu chính: 70000';
            const encrypted = encrypt(longText);
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(longText);
        });

        it('should return original string for tampered ciphertext (legacy compat)', () => {
            const encrypted = encrypt('test');
            const tampered = encrypted.slice(0, -5) + 'XXXXX';
            // decrypt() returns original string on failure (backwards compat with unencrypted legacy data)
            const result = decrypt(tampered);
            expect(result).toBe(tampered);
        });

        it('should return original string for invalid format', () => {
            const invalid = 'not-valid-encrypted-string';
            // No colon separator → returned as-is
            expect(decrypt(invalid)).toBe(invalid);
        });
    });

    describe('Encryption/Decryption roundtrip', () => {
        const testCases = [
            '0901234567',
            'user@example.com',
            '192.168.1.100',
            'Số 456 Đường Lê Lợi, Q.1, TP.HCM',
            '{"name": "Toàn", "age": 21}',
        ];

        testCases.forEach((plaintext) => {
            it(`should roundtrip: "${plaintext.substring(0, 30)}..."`, () => {
                const encrypted = encrypt(plaintext);
                const decrypted = decrypt(encrypted);
                expect(decrypted).toBe(plaintext);
            });
        });
    });
});
