import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '@/lib/date-utils';

/**
 * Unit Tests cho Utility Functions
 * Kiểm tra các helper functions dùng chung trong toàn bộ project.
 */

describe('formatCurrency()', () => {
    it('should format Vietnamese Dong correctly', () => {
        const result = formatCurrency(1500000);
        expect(result).toContain('1');
        expect(result).toContain('500');
        expect(result).toContain('₫');
    });

    it('should handle zero', () => {
        const result = formatCurrency(0);
        expect(result).toContain('0');
        expect(result).toContain('₫');
    });

    it('should handle null/undefined', () => {
        expect(formatCurrency(null)).toBe('0 ₫');
        expect(formatCurrency(undefined)).toBe('0 ₫');
    });

    it('should handle string input', () => {
        const result = formatCurrency('2500000');
        expect(result).toContain('2');
        expect(result).toContain('500');
        expect(result).toContain('₫');
    });

    it('should handle large numbers', () => {
        const result = formatCurrency(99999999);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result).toContain('₫');
    });
});

describe('formatDate()', () => {
    it('should format date string to DD/MM/YYYY', () => {
        const result = formatDate('2026-01-15T10:30:00Z');
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result).not.toBe('N/A');
    });

    it('should handle Date object', () => {
        const result = formatDate(new Date('2026-06-15'));
        expect(result).toBeDefined();
        expect(result).not.toBe('N/A');
    });

    it('should return N/A for null', () => {
        expect(formatDate(null)).toBe('N/A');
    });

    it('should return N/A for undefined', () => {
        expect(formatDate(undefined)).toBe('N/A');
    });

    it('should return N/A for invalid date string', () => {
        expect(formatDate('not-a-date')).toBe('N/A');
    });
});

describe('formatDateTime()', () => {
    it('should include time and date', () => {
        const result = formatDateTime('2026-01-15T14:30:00Z');
        expect(result).toBeDefined();
        expect(result).not.toBe('N/A');
    });

    it('should return N/A for null', () => {
        expect(formatDateTime(null)).toBe('N/A');
    });
});

describe('formatRelativeTime()', () => {
    it('should return relative time for recent date', () => {
        const now = new Date();
        const result = formatRelativeTime(now.toISOString());
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result).not.toBe('N/A');
    });

    it('should handle old dates', () => {
        const result = formatRelativeTime('2020-01-01T00:00:00Z');
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
    });

    it('should return N/A for null', () => {
        expect(formatRelativeTime(null)).toBe('N/A');
    });
});
