import { db } from '../src/lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function verifySchema() {
  console.log('--- Starting Schema Verification ---');

  try {
    // 1. Point 4: Metrics Date
    const [metricsCols]: any = await db.execute(sql`SHOW COLUMNS FROM daily_metrics LIKE 'date'`);
    console.log(
      'Point 4 (Metrics Date Type):',
      metricsCols[0].Type === 'date' ? '✅ PASS' : '❌ FAIL'
    );

    // 2. Point 6: Attribute Unification
    const [attrValuesCols]: any = await db.execute(
      sql`SHOW COLUMNS FROM attribute_values LIKE 'label'`
    );
    const [attrOptionsExists]: any = await db.execute(sql`SHOW TABLES LIKE 'attribute_options'`);
    console.log(
      'Point 6 (Attribute Unification):',
      attrValuesCols.length > 0 && attrOptionsExists.length === 0 ? '✅ PASS' : '❌ FAIL'
    );

    // 3. Point 7: Refund Traceability
    const [refundCols]: any = await db.execute(sql`SHOW COLUMNS FROM refunds LIKE 'request_id'`);
    console.log('Point 7 (Refund Traceability):', refundCols.length > 0 ? '✅ PASS' : '❌ FAIL');

    // 4. Point 5: Support Chat FK
    const [supportChatFK]: any = await db.execute(sql`
            SELECT REFERENCED_TABLE_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'support_chats' AND COLUMN_NAME = 'assigned_admin_id' AND TABLE_SCHEMA = DATABASE()
        `);
    console.log(
      'Point 5 (Support Chat FK Target):',
      supportChatFK[0]?.REFERENCED_TABLE_NAME === 'admin_users' ? '✅ PASS' : '❌ FAIL'
    );

    // 5. Point 1: Unified RBAC
    const [adminRoleCol]: any = await db.execute(sql`SHOW COLUMNS FROM admin_users LIKE 'role'`);
    console.log('Point 1 (Admin Role Removal):', adminRoleCol.length === 0 ? '✅ PASS' : '❌ FAIL');

    // 6. Point 3: Variant-Color Integrity
    const [variantColorCol]: any = await db.execute(
      sql`SHOW COLUMNS FROM product_variants LIKE 'color'`
    );
    const [variantColorIdCol]: any = await db.execute(
      sql`SHOW COLUMNS FROM product_variants LIKE 'color_id'`
    );
    console.log(
      'Point 3 (Variant Color FK):',
      variantColorCol.length === 0 && variantColorIdCol.length > 0 ? '✅ PASS' : '❌ FAIL'
    );

    // 7. Point 2: Stock Consolidation
    const [prodStockCol]: any = await db.execute(
      sql`SHOW COLUMNS FROM products LIKE 'stock_quantity'`
    );
    const [varStockCol]: any = await db.execute(
      sql`SHOW COLUMNS FROM product_variants LIKE 'stock_quantity'`
    );
    console.log(
      'Point 2 (Stock Consolidation):',
      prodStockCol.length === 0 && varStockCol.length === 0 ? '✅ PASS' : '❌ FAIL'
    );
  } catch (error) {
    console.error('Verification Error:', error);
  } finally {
    process.exit(0);
  }
}

verifySchema();
