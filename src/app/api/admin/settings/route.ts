import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

async function checkAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1];
    
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
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
        console.log('Settings table not found, using defaults');
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
  const admin = await checkAdminAuth(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await request.json();

    // Update each setting in database
    for (const [key, value] of Object.entries(settings)) {
      await executeQuery(
        `INSERT INTO settings (\`key\`, value) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [key, String(value)]
      );
    }

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, message: 'Error saving settings' }, { status: 500 });
  }
}
