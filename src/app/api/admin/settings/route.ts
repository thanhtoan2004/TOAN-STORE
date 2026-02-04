import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function ensureSettingsTable() {
  await executeQuery(
    `CREATE TABLE IF NOT EXISTS settings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(255) NOT NULL UNIQUE,
      value TEXT,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
}

async function checkAdminAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    );

    const result = await executeQuery('SELECT is_admin FROM users WHERE id = ?', [decoded.userId]) as any[];
    return result.length > 0 && (result[0] as any).is_admin === 1 ? result[0] : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fetch store settings from database or return defaults
    let result: any[] = [];

    try {
      result = await executeQuery(
        `SELECT 
          COALESCE(value, '') as value, 
          \`key\` as setting_key 
        FROM settings`
      );
    } catch (dbError: any) {
      // If settings table doesn't exist, return defaults
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        await ensureSettingsTable();

        result = [];
      } else {
        throw dbError;
      }
    }

    const settings: any = {
      store_name: 'Nike Clone',
      store_email: 'admin@nike-clone.com',
      store_phone: '0123456789',
      store_address: '123 Main Street',
      store_city: 'Hanoi',
      store_country: 'Vietnam',
      store_currency: 'VND',
      tax_rate: 0.1,
      shipping_cost_domestic: 30000,
      shipping_cost_international: 100000,
      maintenance_mode: false
    };

    // Merge database values
    result.forEach((row: any) => {
      settings[row.setting_key] = row.value;
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: true, data: {} });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await request.json();

    await ensureSettingsTable();

    // Update each setting in database
    for (const [key, value] of Object.entries(settings)) {
      const query = "INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)";
      await executeQuery(query, [key, String(value)]);
    }

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, message: 'Error saving settings' }, { status: 500 });
  }
}
