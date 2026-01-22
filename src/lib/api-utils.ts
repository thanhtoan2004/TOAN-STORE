import { NextResponse } from 'next/server';

/**
 * Standard API error response format
 */
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  code?: string;
}

/**
 * Standard API success response format
 */
export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string
): NextResponse<ApiError> {
  const error: ApiError = {
    success: false,
    message,
    ...(code && { code }),
  };

  return NextResponse.json(error, { status });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string
): NextResponse<ApiSuccess<T>> {
  const response: ApiSuccess<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  };

  return NextResponse.json(response);
}

/**
 * Validates required fields in request body
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
 * Validates numeric range
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
 * Wraps async route handlers with error handling
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);

      // Handle known error types
      if (error instanceof Error) {
        // Database connection errors
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
          return createErrorResponse(
            'Không thể kết nối đến cơ sở dữ liệu',
            503,
            'DATABASE_CONNECTION_ERROR'
          );
        }

        // Validation errors
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          return createErrorResponse(error.message, 400, 'VALIDATION_ERROR');
        }
      }

      // Generic server error
      return createErrorResponse('Đã xảy ra lỗi server nội bộ', 500, 'INTERNAL_SERVER_ERROR');
    }
  };
}

