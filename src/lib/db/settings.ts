
import { executeQuery } from './mysql';

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
    maintenance_mode: boolean;
    [key: string]: any;
}

const DEFAULT_SETTINGS: StoreSettings = {
    store_name: 'TOAN Store',
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

export async function getSettings(): Promise<StoreSettings> {
    try {
        const rows = await executeQuery<any[]>(
            `SELECT \`key\`, value FROM settings`
        );

        const settings: any = { ...DEFAULT_SETTINGS };

        rows.forEach((row) => {
            // Convert value types if necessary (basic parsing)
            let val: any = row.value;

            // Attempt to parse number for specific keys
            if (['tax_rate', 'shipping_cost_domestic', 'shipping_cost_international'].includes(row.key)) {
                val = Number(val);
            }
            else if (row.key === 'maintenance_mode') {
                val = val === 'true' || val === '1';
            }

            settings[row.key] = val;
        });

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
    await executeQuery(
        "INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
        [key, String(value)]
    );
}
