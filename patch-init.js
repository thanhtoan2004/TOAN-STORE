const fs = require('fs');

const dbSqlStr = fs.readFileSync('db.sql', 'utf8');
const initTsStr = fs.readFileSync('src/lib/db/init.ts', 'utf8');

const missingTables = [
  '_migrations',
  'admin_audit_logs',
  'daily_metrics',
  'gift_card_lockouts',
  'inventory_transfers',
  'payment_methods',
  'payments',
  'product_attributes',
  'product_embeddings',
  'product_sizes',
  'refund_requests',
  'role_permissions',
  'search_analytics',
  'shipment_items',
  'shipments',
  'stock_reservations',
  'system_config',
  'system_logs',
  'transactions',
  'user_roles',
  'user_sessions',
  'warehouses',
];

let generatedCode = '\n\n    // --- 21 Drizzle Migration Tables Added for Full Baseline ---\n';

for (const tableName of missingTables) {
  const regexStr = 'CREATE TABLE `' + tableName + '` \\([\\s\\S]*?\\) ENGINE=InnoDB[\\s\\S]*?;';
  const regex = new RegExp(regexStr, 'm');
  const match = dbSqlStr.match(regex);
  if (match) {
    let tableSql = match[0].replace(/`/g, '\\`');
    let innerContent = tableSql.substring(tableSql.indexOf('(') + 1, tableSql.lastIndexOf(')'));
    let enginePart = tableSql.substring(tableSql.lastIndexOf(')') + 1).replace(';', '');

    generatedCode += '\n    // Drizzle table: ' + tableName + '\n';
    generatedCode += '    await connection.query(`\n';
    generatedCode += '      CREATE TABLE IF NOT EXISTS \\`' + tableName + '\\` (\n';
    generatedCode += '        ' + innerContent + '\n';
    generatedCode += '      )' + enginePart + '\n';
    generatedCode += '    `);\n';
  } else {
    console.log('Table ' + tableName + ' not found in db.sql');
  }
}

const insertPoint = "    console.log('Khởi tạo cơ sở dữ liệu thành công');";
const insertIndex = initTsStr.indexOf(insertPoint);

if (insertIndex !== -1) {
  const newInitTs =
    initTsStr.slice(0, insertIndex) + generatedCode + '\n' + initTsStr.slice(insertIndex);
  fs.writeFileSync('src/lib/db/init.ts', newInitTs);
  console.log('Successfully patched init.ts with 21 missing tables');
} else {
  console.log('Could not find insert point in init.ts');
}
