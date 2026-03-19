import { NextResponse } from 'next/server';

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: any;
  metadata?: any;
  error?: string;
  timestamp: string;
};

export class ResponseWrapper {
  static success<T>(
    data: T | null = null,
    message?: string,
    status: number = 200,
    pagination?: any,
    metadata?: any
  ) {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
        pagination,
        metadata,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }

  static error(error: string, status: number = 400, details?: any) {
    return NextResponse.json(
      {
        success: false,
        error,
        details,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }

  static unauthorized(message: string = 'Unauthorized') {
    return this.error(message, 401);
  }

  static forbidden(message: string = 'Forbidden') {
    return this.error(message, 403);
  }

  static notFound(message: string = 'Not Found') {
    return this.error(message, 404);
  }

  static serverError(message: string = 'Internal Server Error', error?: any) {
    return this.error(message, 500, process.env.NODE_ENV === 'development' ? error : undefined);
  }
}
