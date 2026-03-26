import { db } from './drizzle';
import { siteSettings as settingsTable } from './schema';
import { eq, sql } from 'drizzle-orm';
import { invalidateCache } from '@/lib/redis/cache';

const SETTINGS_CACHE_KEY = 'settings:all';
const MAINTENANCE_CACHE_KEY = 'settings:maintenance_mode';

export interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_city: string;
  store_country: string;
  store_currency: string;
  tax_rate: number;
  shipping_cost_domestic: number;
  shipping_cost_international: number;
  gift_wrap_fee: number;
  maintenance_mode: boolean;
  [key: string]: any;
}

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'TOAN Store',
  store_email: 'admin@toanstore.com',
  store_phone: '0123456789',
  store_address: '123 Main Street',
  store_city: 'Hanoi',
  store_country: 'Vietnam',
  store_currency: 'VND',
  tax_rate: 0.1,
  shipping_cost_domestic: 30000,
  shipping_cost_international: 100000,
  gift_wrap_fee: 25000,
  maintenance_mode: false,
};

export async function getSettings(): Promise<StoreSettings> {
  try {
    // 1. Try Cache First
    const { getCache, setCache } = await import('@/lib/redis/cache');
    const cached = await getCache<StoreSettings>(SETTINGS_CACHE_KEY);
    if (cached) return cached;

    // 2. Fetch from DB
    const rows = await db
      .select({
        key: settingsTable.key,
        value: settingsTable.value,
        valueType: settingsTable.valueType,
      })
      .from(settingsTable);

    const settings: any = { ...DEFAULT_SETTINGS };

    rows.forEach((row) => {
      let val: any = row.value;

      // Use value_type for robust parsing
      switch (row.valueType) {
        case 'number':
          val = Number(val);
          break;
        case 'boolean':
          val = val === 'true' || val === '1';
          break;
        case 'json':
          try {
            val = JSON.parse(val || '');
          } catch (e) {
            val = row.value;
          }
          break;
        default:
          // Legacy fallback for known keys if type is not set
          if (
            [
              'tax_rate',
              'shipping_cost_domestic',
              'shipping_cost_international',
              'gift_wrap_fee',
            ].includes(row.key)
          ) {
            val = Number(val);
          } else if (row.key === 'maintenance_mode') {
            val = val === 'true' || val === '1';
          }
      }

      settings[row.key] = val;
    });

    // 3. Save to Cache (30 min)
    await setCache(SETTINGS_CACHE_KEY, settings, 1800);

    return settings;
  } catch (error: any) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return DEFAULT_SETTINGS;
    }
    console.error('Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSetting(key: string, value: any): Promise<void> {
  const valueType =
    typeof value === 'number'
      ? 'number'
      : typeof value === 'boolean'
        ? 'boolean'
        : typeof value === 'object'
          ? 'json'
          : 'string';

  await db
    .insert(settingsTable)
    .values({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      valueType,
    })
    .onDuplicateKeyUpdate({
      set: {
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        valueType,
      },
    });

  // 4. Invalidate Cache
  const { invalidateCache } = await import('@/lib/redis/cache');
  await invalidateCache(SETTINGS_CACHE_KEY);

  if (key === 'maintenance_mode') {
    await invalidateCache(MAINTENANCE_CACHE_KEY);
  }
}
