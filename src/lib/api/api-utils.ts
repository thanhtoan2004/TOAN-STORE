import { NextResponse } from 'next/server';
import { ResponseWrapper } from './api-response';

/**
 * Cấu trúc chuẩn cho phản hồi lỗi từ API.
 */
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  code?: string;
}

/**
 * Cấu trúc chuẩn cho phản hồi thành công từ API.
 */
export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * Tạo nhanh một NextResponse lỗi chuẩn định dạng.
 * @param status Mã HTTP status (Mặc định 500)
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string
): NextResponse<any> {
  return ResponseWrapper.error(message, status, { code });
}

/**
 * Tạo nhanh một NextResponse thành công chuẩn định dạng (Mặc định status 200).
 */
export function createSuccessResponse<T>(data?: T, message?: string): NextResponse<any> {
  return ResponseWrapper.success(data, message);
}

/**
 * Kiểm tra các trường bắt buộc trong Request Body.
 * Trả về chi tiết lỗi nếu thiếu bất kỳ trường nào.
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: Partial<T>,
  requiredFields: (keyof T)[]
): { isValid: true } | { isValid: false; error: string } {
  const missingFields = requiredFields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Kiểm tra giá trị nằm trong khoảng (min/max).
 * Thường dùng để Validate giá sản phẩm hoặc số lượng giỏ hàng.
 */
export function validateNumericRange(
  value: number,
  min?: number,
  max?: number,
  fieldName: string = 'Giá trị'
): { isValid: true } | { isValid: false; error: string } {
  if (min !== undefined && value < min) {
    return {
      isValid: false,
      error: `${fieldName} phải lớn hơn hoặc bằng ${min}`,
    };
  }

  if (max !== undefined && value > max) {
    return {
      isValid: false,
      error: `${fieldName} phải nhỏ hơn hoặc bằng ${max}`,
    };
  }

  return { isValid: true };
}

/**
 * Higher-Order Function (HOF) bọc lấy các Route Handler.
 * Tự động bắt toàn bộ lỗi (crash) và trả về JSON lỗi 500 chuẩn, không làm treo server Edge.
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);

      // Xử lý các lỗi đã biết (Hết kết nối DB, Timeout...)
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
          return createErrorResponse(
            'Không thể kết nối đến cơ sở dữ liệu',
            503,
            'DATABASE_CONNECTION_ERROR'
          );
        }

        if (error.message.includes('validation') || error.message.includes('invalid')) {
          return createErrorResponse(error.message, 400, 'VALIDATION_ERROR');
        }
      }

      return createErrorResponse('Đã xảy ra lỗi server nội bộ', 500, 'INTERNAL_SERVER_ERROR');
    }
  };
}
