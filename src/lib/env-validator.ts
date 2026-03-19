import { z } from 'zod';

/**
 * Schema định nghĩa các biến môi trường bắt buộc của hệ thống.
 * Sử dụng Zod để validate kiểu dữ liệu và giá trị.
 */
const envSchema = z.object({
  // DATABASE
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().default('3306'),
  DB_USER: z.string().min(1),
  DB_NAME: z.string().min(1),

  // SECURITY
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // Thường là 32 byte hex = 64 ký tự

  // REDIS
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.string().default('6379'),

  // AI & EXTERNAL
  GEMINI_API_KEY: z.string().min(1),

  // URLS
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // CRON
  CRON_SECRET: z.string().min(16),
});

/**
 * Kiểm tra tính hợp lệ của tất cả các biến môi trường.
 * Sẽ ném lỗi và dừng ứng dụng nếu cấu hình sai/thiếu.
 */
export function validateEnv() {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully.');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.ZodIssue) => err.path.join('.')).join(', ');
      console.error(`❌ CRITICAL: Missing or invalid environment variables: ${missingVars}`);

      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
}
