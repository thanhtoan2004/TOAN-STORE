import pino from 'pino';

import * as Sentry from '@sentry/nextjs';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Capture an error to Sentry with metadata
 */
export function captureSentryError(level: number, inputArgs: any[]) {
    // pino levels: trace=10, debug=20, info=30, warn=40, error=50, fatal=60
    if (level < 50) return;

    const error = inputArgs.find((arg) => arg instanceof Error);
    const firstArg = inputArgs[0];
    const secondArg = inputArgs[1];

    const message = typeof firstArg === 'string' ? firstArg : (typeof secondArg === 'string' ? secondArg : undefined);

    if (error) {
        Sentry.captureException(error, {
            extra: { pinoMessage: message, pinoLevel: level }
        });
    } else if (message) {
        Sentry.captureMessage(message, {
            level: 'error',
            extra: { pinoLevel: level }
        });
    }
}

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    // Note: transport is disabled because it causes ERR_WORKER_PATH in Next.js environment
    // Use pino-pretty CLI to format logs if needed: npm run dev | npx pino-pretty
    hooks: {
        logMethod(inputArgs, method, level) {
            try {
                captureSentryError(level, inputArgs);
            } catch (e) {
                // Fail-safe to avoid crashing the application if Sentry fails
            }
            method.apply(this, inputArgs);
        },
    },
});

export default logger;
