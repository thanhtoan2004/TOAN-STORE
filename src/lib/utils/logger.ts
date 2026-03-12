import pino from 'pino';

import * as Sentry from '@sentry/nextjs';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Gửi lỗi về hệ thống giám sát Sentry.
 * Tự động kích hoạt khi gọi logger.error() hoặc logger.fatal().
 */
export function captureSentryError(level: number, inputArgs: any[]) {
  // pino levels: trace=10, debug=20, info=30, warn=40, error=50, fatal=60
  if (level < 50) return;

  const error = inputArgs.find((arg) => arg instanceof Error);
  const firstArg = inputArgs[0];
  const secondArg = inputArgs[1];

  const message =
    typeof firstArg === 'string' ? firstArg : typeof secondArg === 'string' ? secondArg : undefined;

  if (error) {
    Sentry.captureException(error, {
      extra: { pinoMessage: message, pinoLevel: level },
    });
  } else if (message) {
    Sentry.captureMessage(message, {
      level: 'error',
      extra: { pinoLevel: level },
    });
  }
}

/**
 * Đối tượng Logger chính của hệ thống (Sử dụng Pino).
 * Tích hợp sẵn Ghi log dạng JSON (chuẩn Enterprise) và gửi cảnh báo lỗi về Sentry.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Lưu ý: transport bị tắt do lỗi ERR_WORKER_PATH trong môi trường Next.js.
  // Dùng pino-pretty CLI để format log nếu cần: npm run dev | npx pino-pretty
  hooks: {
    logMethod(inputArgs, method, level) {
      try {
        captureSentryError(level, inputArgs);
      } catch (e) {
        // Fail-safe: Tránh làm sập ứng dụng nếu Sentry gặp lỗi
      }
      method.apply(this, inputArgs);
    },
  },
});

export default logger;
