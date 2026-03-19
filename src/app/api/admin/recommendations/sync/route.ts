import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { db } from '@/lib/db/drizzle';
import { products as productsTable, categories, productEmbeddings } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ResponseWrapper } from '@/lib/api/api-response';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * API Đồng bộ dữ liệu Recommendation (Gợi ý sản phẩm).
 * Chức năng:
 * - Duyệt qua tất cả sản phẩm đang hoạt động (Active).
 * - Tạo chuỗi văn bản mô tả (Rich representation) cho từng sản phẩm.
 * - Sử dụng Gemini `text-embedding-004` để tạo vector đặc trưng (Embedding).
 * - Lưu trữ/Cập nhật vector vào bảng `product_embeddings` phục vụ tìm kiếm tương đồng (Similarity search).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    if (!process.env.GEMINI_API_KEY) {
      return ResponseWrapper.serverError('Gemini API key not configured');
    }

    // 1. Fetch all active products
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        shortDescription: productsTable.shortDescription,
        description: productsTable.description,
        category: categories.name,
      })
      .from(productsTable)
      .leftJoin(categories, eq(productsTable.categoryId, categories.id))
      .where(and(eq(productsTable.isActive, 1), isNull(productsTable.deletedAt)));

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    let syncCount = 0;

    for (const product of products) {
      // Create a rich text representation for embedding
      const textToEmbed = `
        Product: ${product.name}
        Category: ${product.category || 'Uncategorized'}
        Description: ${product.shortDescription || ''} ${product.description || ''}
      `.trim();

      try {
        const result = await model.embedContent(textToEmbed);
        const embedding = result.embedding.values;

        // Save or update embedding using Drizzle MySQL onDuplicateKeyUpdate
        await db
          .insert(productEmbeddings)
          .values({
            productId: product.id,
            embedding: embedding,
          })
          .onDuplicateKeyUpdate({
            set: { embedding: embedding },
          });

        syncCount++;
      } catch (embedError) {
        console.error(`Error embedding product ${product.id}:`, embedError);
      }
    }

    const result = {
      syncCount,
      totalProducts: products.length,
    };

    return ResponseWrapper.success(result, `Synchronized ${syncCount} product embeddings.`);
  } catch (error) {
    console.error('Embedding Sync Error:', error);
    return ResponseWrapper.serverError('Server error', error);
  }
}
