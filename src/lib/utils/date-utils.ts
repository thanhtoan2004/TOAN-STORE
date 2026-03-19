/**
 * Tiện ích xử lý Ngày tháng và Tiền tệ cho TOAN Store.
 * Ép buộc sử dụng múi giờ Việt Nam (UTC+7) và định dạng chuẩn quốc gia.
 */
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Định dạng ngày theo kiểu Việt Nam (DD/MM/YYYY).
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
      year: 'numeric',
    });
  } catch (e) {
    return 'N/A';
  }
}

/**
 * Định dạng ngày giờ đầy đủ (HH:mm DD/MM/YYYY).
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'N/A';

    return d.toLocaleString('vi-VN', {
      timeZone: VIETNAM_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    });
  } catch (e) {
    return 'N/A';
  }
}

/**
 * Lấy đối tượng Date hiện tại.
 */
export function getVietnamNow(): Date {
  return new Date();
}

/**
 * Định dạng tiền tệ Việt Nam Đồng (₫).
 * Ví dụ: 100000 -> 100.000 ₫
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (value === null || value === undefined || isNaN(value)) return '0 ₫';

  return (
    value.toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + ' ₫'
  );
}

/**
 * Định dạng ngày giờ cho MySQL (YYYY-MM-DD HH:mm:ss).
 */
export function formatDateForMySQL(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  // Manual formatting to avoid UTC shift from toISOString()
  const pad = (n: number) => n.toString().padStart(2, '0');

  // Use Intl to get parts in VN timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
}

/**
 * Trả về chuỗi thời gian tương đối (Ví dụ: "2 giờ trước", "Vừa xong").
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;

  try {
    return formatDistanceToNow(d, { addSuffix: true, locale: vi });
  } catch (e) {
    // Fallback đơn giản nếu thư viện date-fns gặp lỗi
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
