import mysql from 'mysql2/promise';
import { validateEnv } from '../env-validator';

// Tự động kiểm tra các biến môi trường khi khởi tạo hệ thống DB
validateEnv();

// Tạo pool kết nối MySQL
// Chỉ set password nếu có giá trị (không phải undefined hoặc chuỗi rỗng)
const dbPassword =
  process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== ''
    ? process.env.DB_PASSWORD
    : undefined;

// Tạo config object, chỉ thêm password nếu có giá trị
const poolConfig: any = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'toan_store',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+07:00',
};

// Chỉ thêm password vào config nếu có giá trị
if (dbPassword !== undefined) {
  poolConfig.password = dbPassword;
}

export const pool = mysql.createPool(poolConfig);

console.log(
  `[SERVICE_INITIALIZATION] MySQL Pool created for database: ${poolConfig.database} on ${poolConfig.host}`
);

/**
 * Kiểm tra kết nối nhanh để hiển thị log hoặc xem db có hoạt động không
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();

    connection.release();
    return true;
  } catch (error) {
    console.error('Không thể kết nối đến MySQL:', error);
    return false;
  }
}

/**
 * Thực thi một câu truy vấn MySQL tiêu chuẩn và tự động nhả kết nối ra cho Pool
 * Mọi query string (SELECT/INSERT/UPDATE) đều chạy qua hàm này.
 * Cú pháp: executeQuery<Product[]>('SELECT * FROM products WHERE id=?', [id])
 */
export async function executeQuery<T = unknown[]>(
  query: string,
  params: (string | number | null)[] = []
): Promise<T> {
  try {
    const [rows] = await pool.query(query, params);
    return rows as T;
  } catch (error) {
    console.error('Lỗi thực thi truy vấn:', error);
    throw error;
  }
}

// Export helper for transactions
export async function getConnection() {
  return pool.getConnection();
}

/**
 * Helper dự phòng, chức năng y hệt executeQuery
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

/**
 * Hàm bao bọc chuyên dụng (Wrapper) cho DB Transaction (Giao dịch nguyên tử).
 * Thường dùng trong thanh toán hoặc đặt hàng (chỉ Commit khi tất cả lệnh SQL đều chạy đúng,
 * Nếu 1 lệnh Fail -> Tự động Rollback, không lưu để giữ Database không bị lệch).
 *
 * @param callback Hàm chứa tập hợp nhiều câu query
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
