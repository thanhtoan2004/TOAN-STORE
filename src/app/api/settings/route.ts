import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db/settings';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET - Lấy cấu hình công khai của hệ thống.
 */
export async function GET() {
  try {
    const settings = await getSettings();

    // Chỉ trả về các trường công khai để bảo mật
    const publicSettings = {
      store_name: settings.store_name,
      store_currency: settings.store_currency,
      tax_rate: settings.tax_rate,
      shipping_cost_domestic: settings.shipping_cost_domestic,
      shipping_cost_international: settings.shipping_cost_international,
      gift_wrap_fee: settings.gift_wrap_fee || 25000,
    };

    return ResponseWrapper.success(publicSettings);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    // Fallback data for critical settings
    const fallback = {
      gift_wrap_fee: 25000,
      tax_rate: 0.1,
      shipping_cost_domestic: 30000,
    };
    return ResponseWrapper.serverError('Internal server error', { fallback });
  }
}
