import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { db } from '@/lib/db/drizzle';
import { products as productsTable, categories, brands } from '@/lib/db/schema';
import { eq, and, isNull, sql, desc } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Nhập/Xuất Sản phẩm Hàng loạt (Bulk Import/Export).
 * Chức năng:
 * - GET: Xuất toàn bộ danh sách sản phẩm hiện có ra file Excel (.xlsx).
 * - POST: Nhập sản phẩm mới từ file Excel (.xlsx, .xls, .csv).
 * Rào cản: Giới hạn 500 dòng/lần và file tối đa 5MB.
 * Bảo mật: Yêu cầu quyền Admin.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 500;
const MAX_NAME_LENGTH = 500;

/**
 * GET - Xuất toàn bộ sản phẩm ra file Excel (.xlsx).
 */
export async function GET() {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const products = await db
      .select({
        sku: productsTable.sku,
        name: productsTable.name,
        slug: productsTable.slug,
        price_cache: productsTable.priceCache,
        msrp_price: productsTable.msrpPrice,
        short_description: productsTable.shortDescription,
        description: productsTable.description,
        category_name: categories.name,
        brand_name: brands.name,
        is_active: productsTable.isActive,
        is_featured: productsTable.isFeatured,
        is_new_arrival: productsTable.isNewArrival,
      })
      .from(productsTable)
      .leftJoin(categories, eq(productsTable.categoryId, categories.id))
      .leftJoin(brands, eq(productsTable.brandId, brands.id))
      .where(isNull(productsTable.deletedAt))
      .orderBy(desc(productsTable.createdAt));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Add headers
    worksheet.columns = [
      { header: 'SKU', key: 'sku', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Slug', key: 'slug', width: 30 },
      { header: 'Price', key: 'price_cache', width: 15 },
      { header: 'MSRP Price', key: 'msrp_price', width: 15 },
      { header: 'Short Description', key: 'short_description', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Brand', key: 'brand_name', width: 20 },
      { header: 'Active', key: 'is_active', width: 10 },
      { header: 'Featured', key: 'is_featured', width: 10 },
      { header: 'New Arrival', key: 'is_new_arrival', width: 12 },
    ];

    // Add data
    products.forEach((product) => {
      worksheet.addRow(product);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="products_export_${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[Bulk Export] Lỗi khi xuất sản phẩm:', error);
    return ResponseWrapper.serverError('Lỗi xuất file Excel sản phẩm', error);
  }
}

/**
 * POST - Nhập sản phẩm hàng loạt từ file Excel/CSV.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return ResponseWrapper.error('Chưa chọn file để nhập', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return ResponseWrapper.error(`File quá lớn. Tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB`, 400);
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return ResponseWrapper.error('Chỉ hỗ trợ file định dạng .xlsx, .xls, .csv', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1); // First worksheet

    if (!worksheet) {
      return ResponseWrapper.error('File Excel không có worksheet hợp lệ', 400);
    }
    const rows: any[] = [];

    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber === 1) return; // Skip header
      const rowData: any = {};
      row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
        const header = (worksheet.getCell(1, colNumber).value?.toString() || '')
          .toLowerCase()
          .replace(/\s+/g, '_');
        rowData[header] = cell.value;
      });
      rows.push(rowData);
    });

    if (rows.length === 0) {
      return ResponseWrapper.error('File không có dữ liệu để nhập', 400);
    }

    if (rows.length > MAX_ROWS) {
      return ResponseWrapper.error(
        `Tối đa ${MAX_ROWS} sản phẩm/lần. File có ${rows.length} dòng.`,
        400
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const categoryCache = new Map<string, number>();
    const brandCache = new Map<string, number>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const name = row.name?.toString()?.trim();
        if (!name) {
          errors.push(`Dòng ${rowNum}: Thiếu tên sản phẩm`);
          skipped++;
          continue;
        }
        if (name.length > MAX_NAME_LENGTH) {
          errors.push(`Dòng ${rowNum}: Tên sản phẩm quá dài (tối đa ${MAX_NAME_LENGTH} ký tự)`);
          skipped++;
          continue;
        }

        const priceValue = row.price_cache || row.price;
        const priceCache = parseFloat(priceValue);
        if (isNaN(priceCache) || priceCache < 0) {
          errors.push(`Dòng ${rowNum}: Giá gốc không hợp lệ`);
          skipped++;
          continue;
        }

        let msrpPrice: string | null = null;
        if (row.msrp_price !== undefined && row.msrp_price !== '') {
          const parsedMsrp = parseFloat(row.msrp_price);
          if (!isNaN(parsedMsrp) && parsedMsrp >= 0) {
            msrpPrice = String(parsedMsrp);
          }
        }

        let categoryId: number | null = null;
        const catName = row.category_name?.toString()?.trim();
        if (catName) {
          if (categoryCache.has(catName)) {
            categoryId = categoryCache.get(catName)!;
          } else {
            const [cat] = await db
              .select({ id: categories.id })
              .from(categories)
              .where(and(eq(categories.name, catName), isNull(categories.deletedAt)))
              .limit(1);
            if (cat) {
              categoryId = cat.id;
              categoryCache.set(catName, cat.id);
            }
          }
        }

        let brandId: number | null = null;
        const brandName = row.brand_name?.toString()?.trim();
        if (brandName) {
          if (brandCache.has(brandName)) {
            brandId = brandCache.get(brandName)!;
          } else {
            const [brand] = await db
              .select({ id: brands.id })
              .from(brands)
              .where(eq(brands.name, brandName))
              .limit(1);
            if (brand) {
              brandId = brand.id;
              brandCache.set(brandName, brand.id);
            }
          }
        }

        const sku = row.sku?.toString()?.trim() || `IMPORT-${Date.now()}-${i}`;
        const slug =
          row.slug?.toString()?.trim() ||
          name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') + `-${Date.now()}-${i}`;

        await db.insert(productsTable).values({
          sku,
          name,
          slug,
          priceCache: String(priceCache),
          msrpPrice,
          shortDescription: row.short_description?.toString()?.trim() || '',
          description: row.description?.toString()?.trim() || '',
          categoryId,
          brandId,
          isActive: row.is_active !== undefined ? Number(row.is_active) : 1,
          isFeatured: row.is_featured !== undefined ? Number(row.is_featured) : 0,
          isNewArrival: row.is_new_arrival !== undefined ? Number(row.is_new_arrival) : 1,
        });

        imported++;
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') {
          errors.push(`Dòng ${rowNum}: Trùng SKU hoặc slug`);
        } else {
          errors.push(`Dòng ${rowNum}: ${err.message}`);
        }
        skipped++;
      }
    }

    await logAdminAction(
      admin.userId,
      'BULK_IMPORT_PRODUCTS',
      'products',
      0,
      null,
      { imported, skipped, total: rows.length, fileName: file.name },
      request as any
    );

    const result = {
      imported,
      skipped,
      total: rows.length,
      errors: errors.slice(0, 20),
    };

    return ResponseWrapper.success(
      result,
      `Import hoàn tất: ${imported} thành công, ${skipped} bỏ qua`
    );
  } catch (error) {
    console.error('[Bulk Import] Lỗi khi nhập sản phẩm:', error);
    return ResponseWrapper.serverError('Lỗi server khi nhập dữ liệu sản phẩm', error);
  }
}
