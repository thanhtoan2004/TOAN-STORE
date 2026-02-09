import { NextRequest, NextResponse } from 'next/server';

/**
 * Global error handler wrapper
 */
export function withErrorHandler(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
        try {
            return await handler(req, ...args);
        } catch (error: any) {
            console.error('API Error:', {
                url: req.url,
                method: req.method,
                error: error.message,
                stack: error.stack
            });

            // Determine error type and status code
            let statusCode = 500;
            let message = 'Internal server error';

            if (error.name === 'ValidationError') {
                statusCode = 400;
                message = error.message;
            } else if (error.name === 'UnauthorizedError') {
                statusCode = 401;
                message = 'Unauthorized';
            } else if (error.name === 'ForbiddenError') {
                statusCode = 403;
                message = 'Forbidden';
            } else if (error.name === 'NotFoundError') {
                statusCode = 404;
                message = 'Not found';
            }

            return NextResponse.json({
                success: false,
                error: {
                    message,
                    code: error.code || 'INTERNAL_ERROR',
                    ...(process.env.NODE_ENV === 'development' && {
                        stack: error.stack,
                        details: error
                    })
                }
            }, { status: statusCode });
        }
    };
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class UnauthorizedError extends Error {
    constructor(message: string = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor(message: string = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string = 'Not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

/**
 * Validate request body
 */
export function validateBody(body: any, requiredFields: string[]) {
    const missing = requiredFields.filter(field => !body[field]);

    if (missing.length > 0) {
        throw new ValidationError(
            `Missing required fields: ${missing.join(', ')}`
        );
    }
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: any) {
    console.error('Database error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
        throw new ValidationError('Duplicate entry');
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new ValidationError('Referenced record not found');
    } else {
        throw new Error('Database operation failed');
    }
}
