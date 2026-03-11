async function start() {
  process.env.DB_PORT = '3307';
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PASSWORD = 'root';

  // Import after setting env vars
  const { executeQuery } = await import('../src/lib/db/mysql');
  const { logAdminAction } = await import('../src/lib/audit');

  console.log('--- Phase 23 Verification ---');
  console.log('Using Port:', process.env.DB_PORT);

  // 1. Mock parameters
  const adminId = 1;
  const productId = 1;
  const oldValues = { name: 'Old Product Name', msrp_price: 100000 };
  const newValues = { name: 'New Product Name', msrp_price: 93333 };

  console.log('Logging test action...');
  await logAdminAction(
    adminId,
    'VERIFY_AUDIT_PHASE_23_FINAL',
    'test_module',
    productId,
    oldValues,
    newValues
  );

  console.log('Checking database entry...');
  const logs = await executeQuery<any[]>(
    'SELECT * FROM admin_activity_logs WHERE action = ? ORDER BY created_at DESC LIMIT 1',
    ['VERIFY_AUDIT_PHASE_23_FINAL']
  );

  if (logs.length > 0) {
    const log = logs[0];
    console.log('✅ Found audit log entry:');
    console.log(`Action: ${log.action}`);
    console.log(`Old Values: ${log.old_values}`);
    console.log(`New Values: ${log.new_values}`);

    const oldParsed = JSON.parse(log.old_values);
    const newParsed = JSON.parse(log.new_values);

    if (oldParsed.name === 'Old Product Name' && newParsed.msrp_price === 93333) {
      console.log('✅ Audit data verification SUCCESSFUL!');
    } else {
      console.log('❌ Audit data verification FAILED: Data mismatch');
    }
  } else {
    console.log('❌ Verification FAILED: log entry not found');
  }

  process.exit(0);
}

start().catch(console.error);
