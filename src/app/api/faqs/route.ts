import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { faqs as faqsTable, faqCategories } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy danh sách câu hỏi thường gặp (FAQs) và danh mục FAQ.
 * Hỗ trợ lọc theo categoryId và tự động sắp xếp theo vị trí hiển thị đã cấu hình.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');

    const filters = [eq(faqsTable.isActive, 1), eq(faqCategories.isActive, 1)];
    if (categoryId) {
      filters.push(eq(faqsTable.categoryId, Number(categoryId)));
    }

    const faqs = await db
      .select({
        id: faqsTable.id,
        question: faqsTable.question,
        answer: faqsTable.answer,
        helpfulCount: faqsTable.helpfulCount,
        categoryId: faqCategories.id,
        categoryName: faqCategories.name,
        categorySlug: faqCategories.slug,
      })
      .from(faqsTable)
      .innerJoin(faqCategories, eq(faqsTable.categoryId, faqCategories.id))
      .where(and(...filters))
      .orderBy(asc(faqCategories.position), asc(faqsTable.position));

    // Lấy danh sách categories
    const categoriesList = await db
      .select({
        id: faqCategories.id,
        name: faqCategories.name,
        slug: faqCategories.slug,
        description: faqCategories.description,
        icon: faqCategories.icon,
      })
      .from(faqCategories)
      .where(eq(faqCategories.isActive, 1))
      .orderBy(asc(faqCategories.position));

    return ResponseWrapper.success({
      faqs,
      categories: categoriesList,
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return ResponseWrapper.serverError('Không thể tải danh sách câu hỏi', error);
  }
}
