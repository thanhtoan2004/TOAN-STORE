import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';
import * as XLSX from 'xlsx';
import { logAdminAction } from '@/lib/audit';

/**
 * API Nhập/Xuất Sản phẩm Hàng loạt (Bulk Import/Export)
 *
 * Bảo mật:
 * - Yêu cầu xác thực Admin (checkAdminAuth) cho cả Import và Export.
 * - Giới hạn kích thước file upload: tối đa 5MB.
 * - Giới hạn số hàng import: tối đa 500 sản phẩm/lần (tránh quá tải DB).
 * - Validate từng hàng trước khi INSERT, bỏ qua hàng lỗi thay vì dừng cả batch.
 * - Sanitize tên sản phẩm: trim khoảng trắng thừa, kiểm tra độ dài tối đa.
 * - Ghi Audit Log: lưu lại ai đã import bao nhiêu sản phẩm.
 */

/** Giới hạn kích thước file (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Giới hạn số dòng (500 sản phẩm/lần) */
const MAX_ROWS = 500;

/** Độ dài tối đa tên sản phẩm */
const MAX_NAME_LENGTH = 500;

/**
 * GET - Xuất toàn bộ sản phẩm ra file Excel (.xlsx).
 *
 * Dữ liệu bao gồm: SKU, tên, giá gốc/bán lẻ, danh mục, thương hiệu.
 * File có thể dùng để chỉnh sửa rồi import lại.
 */
export async function GET() {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Query toàn bộ sản phẩm chưa xóa, join tên danh mục và thương hiệu
    const products = (await executeQuery(`
      SELECT 
        p.sku, p.name, p.slug, p.price_cache, p.msrp_price,
        p.short_description, p.description,
        c.name as category_name, b.name as brand_name,
        p.is_active, p.is_featured, p.is_new_arrival
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `)) as any[];

    // Tạo file Excel từ dữ liệu JSON
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="products_export_${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[Bulk Export] Lỗi khi xuất sản phẩm:', error);
    return NextResponse.json({ success: false, message: 'Lỗi xuất file' }, { status: 500 });
  }
}

/**
 * POST - Nhập sản phẩm hàng loạt từ file Excel/CSV.
 *
 * Cấu trúc file:
 * - Cột bắt buộc: name, price_cache
 * - Cột tùy chọn: sku, slug, msrp_price, short_description, description,
 *   category_name, brand_name, is_active, is_featured, is_new_arrival
 *
 * Xử lý thông minh:
 * - Tự động tra cứu category_name → category_id (có cache để tối ưu).
 * - Tự động tra cứu brand_name → brand_id (có cache để tối ưu).
 * - Tự sinh slug nếu không cung cấp (hỗ trợ tiếng Việt có dấu).
 * - Tự sinh SKU nếu không cung cấp (format: IMPORT-timestamp-index).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // === VALIDATION ===

    if (!file) {
      return NextResponse.json({ success: false, message: 'Chưa chọn file' }, { status: 400 });
    }

    // Kiểm tra kích thước file (tránh upload file quá lớn gây tràn bộ nhớ)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `File quá lớn. Tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Kiểm tra phần mở rộng file
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, message: 'Chỉ hỗ trợ file .xlsx, .xls, .csv' },
        { status: 400 }
      );
    }

    // === ĐỌC FILE ===

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'File không có dữ liệu' },
        { status: 400 }
      );
    }

    // Giới hạn số dòng để tránh quá tải Database
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        {
          success: false,
          message: `Tối đa ${MAX_ROWS} sản phẩm/lần. File có ${rows.length} dòng.`,
        },
        { status: 400 }
      );
    }

    // === XỬ LÝ IMPORT ===

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Cache tra cứu danh mục/thương hiệu (tránh query DB trùng lặp)
    const categoryCache = new Map<string, number>();
    const brandCache = new Map<string, number>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Số dòng Excel thực tế (header = dòng 1)

      try {
        // Validate tên sản phẩm
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

        // Validate giá gốc
        const priceCache = parseFloat(row.price_cache);
        if (isNaN(priceCache) || priceCache < 0) {
          errors.push(`Dòng ${rowNum}: Giá gốc không hợp lệ`);
          skipped++;
          continue;
        }

        // Validate giá bán lẻ (nếu có)
        let msrpPrice: number | null = null;
        if (row.msrp_price !== undefined && row.msrp_price !== '') {
          msrpPrice = parseFloat(row.msrp_price);
          if (isNaN(msrpPrice) || msrpPrice < 0) {
            errors.push(`Dòng ${rowNum}: Giá bán lẻ không hợp lệ`);
            skipped++;
            continue;
          }
        }

        // Tra cứu danh mục (category_name → category_id)
        let categoryId: number | null = null;
        const catName = row.category_name?.toString()?.trim();
        if (catName) {
          if (categoryCache.has(catName)) {
            categoryId = categoryCache.get(catName)!;
          } else {
            const [cat] = (await executeQuery(
              'SELECT id FROM categories WHERE name = ? AND deleted_at IS NULL LIMIT 1',
              [catName]
            )) as any[];
            if (cat) {
              categoryId = cat.id;
              categoryCache.set(catName, cat.id);
            }
          }
        }

        // Tra cứu thương hiệu (brand_name → brand_id)
        let brandId: number | null = null;
        const brandName = row.brand_name?.toString()?.trim();
        if (brandName) {
          if (brandCache.has(brandName)) {
            brandId = brandCache.get(brandName)!;
          } else {
            const [brand] = (await executeQuery('SELECT id FROM brands WHERE name = ? LIMIT 1', [
              brandName,
            ])) as any[];
            if (brand) {
              brandId = brand.id;
              brandCache.set(brandName, brand.id);
            }
          }
        }

        // Tự sinh SKU nếu không có
        const sku = row.sku?.toString()?.trim() || `IMPORT-${Date.now()}-${i}`;

        // Tự sinh slug từ tên tiếng Việt (bỏ dấu, thay khoảng trắng bằng gạch ngang)
        const slug =
          row.slug?.toString()?.trim() ||
          name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') + `-${Date.now()}-${i}`;

        // INSERT vào bảng products
        await executeQuery(
          `
          INSERT INTO products (sku, name, slug, price_cache, msrp_price, short_description, description, 
            category_id, brand_id, is_active, is_featured, is_new_arrival)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            sku,
            name,
            slug,
            priceCache,
            msrpPrice,
            row.short_description?.toString()?.trim() || '',
            row.description?.toString()?.trim() || '',
            categoryId,
            brandId,
            row.is_active !== undefined ? Number(row.is_active) : 1,
            row.is_featured !== undefined ? Number(row.is_featured) : 0,
            row.is_new_arrival !== undefined ? Number(row.is_new_arrival) : 1,
          ]
        );

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

    // Ghi Audit Log để theo dõi Admin nào đã import
    await logAdminAction(
      admin.userId,
      'BULK_IMPORT_PRODUCTS',
      'products',
      0,
      null,
      { imported, skipped, total: rows.length, fileName: file.name },
      request
    );

    return NextResponse.json({
      success: true,
      message: `Import hoàn tất: ${imported} thành công, ${skipped} bỏ qua`,
      data: { imported, skipped, total: rows.length, errors: errors.slice(0, 20) },
    });
  } catch (error) {
    console.error('[Bulk Import] Lỗi khi nhập sản phẩm:', error);
    return NextResponse.json({ success: false, message: 'Lỗi import' }, { status: 500 });
  }
}
