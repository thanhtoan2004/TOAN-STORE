/**
 * Common date utilities for TOAN Store
 * Enforces Vietnam timezone (UTC+7) and consistent formatting
 */

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Formats a date string or object to a Vietnamese locale date string (DD/MM/YYYY)
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 'N/A';

        return d.toLocaleDateString('vi-VN', {
            timeZone: VIETNAM_TIMEZONE,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'N/A';
    }
}

/**
 * Formats a date string or object to a Vietnamese locale datetime string (HH:mm DD/MM/YYYY)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 'N/A';

        return d.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour12: false
        });
    } catch (e) {
        return 'N/A';
    }
}

/**
 * Gets a Date object representing the current time in Vietnam
 */
export function getVietnamNow(): Date {
    // JavaScript Date objects are always UTC internally, 
    // but we can compute the current time offset if needed.
    // For most display purposes, using timeZone in toLocaleString is sufficient.
    return new Date();
}

/**
 * Formats a currency value to Vietnamese Dong (₫)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (value === null || value === undefined || isNaN(value)) return '0 ₫';

    return value.toLocaleString('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) + ' ₫';
}

/**
 * Formats a date to YYYY-MM-DD HH:mm:ss for MySQL
 */
export function formatDateForMySQL(date: string | Date | null | undefined): string | null {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;

    // ISO string is YYYY-MM-DDTHH:mm:ss.sssZ
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Returns a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;

    try {
        const { formatDistanceToNow } = require('date-fns');
        const { vi } = require('date-fns/locale');
        return formatDistanceToNow(d, { addSuffix: true, locale: vi });
    } catch (e) {
        // Simple fallback if date-fns fails
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (diffInSeconds < 60) return 'Vừa xong';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        return formatDate(date);
    }
}
