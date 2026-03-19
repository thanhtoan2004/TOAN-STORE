import { db } from '../drizzle';
import { media } from '../schema';
import { eq, and, sql, desc, like, or } from 'drizzle-orm';

export interface MediaItem {
  id: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  altText?: string;
  folder?: string;
  createdAt: Date;
}

/**
 * Lấy danh sách tệp tin media.
 */
export async function getMedia(
  options: {
    folder?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ data: any[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 30;
  const offset = (page - 1) * limit;

  const filters = [];
  if (options.folder) {
    filters.push(eq(media.folder, options.folder));
  }
  if (options.search) {
    filters.push(
      or(like(media.fileName, `%${options.search}%`), like(media.altText, `%${options.search}%`))
    );
  }

  const data = await db
    .select()
    .from(media)
    .where(and(...filters))
    .orderBy(desc(media.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: sql`count(*)` })
    .from(media)
    .where(and(...filters));

  return {
    data,
    total: Number((totalResult as any)?.count || 0),
  };
}

/**
 * Lưu thông tin tệp tin mới vào database.
 */
export async function addMedia(data: Partial<MediaItem>): Promise<number> {
  const [result] = await db.insert(media).values({
    fileName: data.fileName!,
    filePath: data.filePath!,
    fileSize: data.fileSize || null,
    mimeType: data.mimeType || null,
    width: data.width || null,
    height: data.height || null,
    altText: data.altText || null,
    folder: data.folder || 'general',
  });
  return result.insertId;
}

/**
 * Xóa tệp tin media.
 */
export async function deleteMedia(id: number): Promise<void> {
  await db.delete(media).where(eq(media.id, id));
}

/**
 * Lấy thống kê về media (tổng dung lượng, phân bổ theo thư mục, v.v.)
 */
export async function getMediaStats(): Promise<{ totalSize: number; totalFiles: number }> {
  try {
    const [result] = await db
      .select({
        totalSize: sql<number>`SUM(IFNULL(${media.fileSize}, 0))`,
        totalFiles: sql<number>`COUNT(*)`,
      })
      .from(media);

    return {
      totalSize: Number(result?.totalSize || 0),
      totalFiles: Number(result?.totalFiles || 0),
    };
  } catch (error) {
    console.error('Error fetching media stats:', error);
    return { totalSize: 0, totalFiles: 0 };
  }
}
