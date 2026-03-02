/**
 * Database Seed Script
 * 
 * Seeds the database with essential reference data (categories, brands, collections, FAQ categories).
 * Run: npx tsx scripts/seed.ts
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { executeQuery } from '../src/lib/db/mysql';

interface SeedTable {
    name: string;
    check: string;
    data: string;
}

const seeds: SeedTable[] = [
    // --- Brands ---
    {
        name: 'brands',
        check: 'SELECT COUNT(*) as count FROM brands',
        data: `INSERT INTO brands (name, slug, description) VALUES
            ('Nike', 'nike', 'Just Do It'),
            ('Jordan', 'jordan', 'Air Jordan Brand'),
            ('Nike SB', 'nike-sb', 'Nike Skateboarding')
        ON DUPLICATE KEY UPDATE name = VALUES(name)`
    },

    // --- Categories ---
    {
        name: 'categories',
        check: 'SELECT COUNT(*) as count FROM categories',
        data: `INSERT INTO categories (name, slug, description, position) VALUES
            ('Running', 'running', 'Running shoes and apparel', 1),
            ('Basketball', 'basketball', 'Basketball shoes and gear', 2),
            ('Training', 'training', 'Training and gym equipment', 3),
            ('Lifestyle', 'lifestyle', 'Casual and lifestyle products', 4),
            ('Jordan', 'jordan', 'Air Jordan collection', 5),
            ('Football', 'football', 'Football boots and equipment', 6)
        ON DUPLICATE KEY UPDATE name = VALUES(name)`
    },

    // --- Collections ---
    {
        name: 'collections',
        check: 'SELECT COUNT(*) as count FROM collections',
        data: `INSERT INTO collections (name, slug, description) VALUES
            ('Air Max', 'air-max', 'Air Max collection'),
            ('Air Force', 'air-force', 'Air Force collection'),
            ('Dunk', 'dunk', 'Nike Dunk collection'),
            ('Pegasus', 'pegasus', 'Pegasus running collection')
        ON DUPLICATE KEY UPDATE name = VALUES(name)`
    },

    // --- FAQ Categories ---
    {
        name: 'faq_categories',
        check: 'SELECT COUNT(*) as count FROM faq_categories',
        data: `INSERT INTO faq_categories (name, slug, description, icon, position) VALUES
            ('Đặt hàng', 'order', 'Câu hỏi về quy trình đặt hàng', 'shopping-cart', 1),
            ('Vận chuyển', 'shipping', 'Thông tin về vận chuyển và giao hàng', 'truck', 2),
            ('Thanh toán', 'payment', 'Các phương thức thanh toán', 'credit-card', 3),
            ('Đổi trả', 'returns', 'Chính sách đổi trả hàng', 'refresh', 4),
            ('Sản phẩm', 'products', 'Thông tin về sản phẩm', 'box', 5)
        ON DUPLICATE KEY UPDATE name = VALUES(name)`
    },

    // --- FAQs ---
    {
        name: 'faqs',
        check: 'SELECT COUNT(*) as count FROM faqs',
        data: `INSERT INTO faqs (category_id, question, answer, position) VALUES
            ((SELECT id FROM faq_categories WHERE slug = 'order'), 'Làm thế nào để đặt hàng?', 'Bạn có thể đặt hàng trực tuyến qua website của chúng tôi.', 1),
            ((SELECT id FROM faq_categories WHERE slug = 'order'), 'Tôi có thể hủy đơn hàng không?', 'Bạn có thể hủy đơn hàng trong vòng 24 giờ sau khi đặt.', 2),
            ((SELECT id FROM faq_categories WHERE slug = 'shipping'), 'Thời gian giao hàng là bao lâu?', 'Thời gian giao hàng tiêu chuẩn là 2–5 ngày làm việc.', 1),
            ((SELECT id FROM faq_categories WHERE slug = 'shipping'), 'Chi phí vận chuyển là bao nhiêu?', 'Phí vận chuyển là 30.000đ cho đơn hàng dưới mức quy định.', 2),
            ((SELECT id FROM faq_categories WHERE slug = 'payment'), 'Có những phương thức thanh toán nào?', 'Chúng tôi hỗ trợ: COD, chuyển khoản ngân hàng, VNPay, MoMo.', 1),
            ((SELECT id FROM faq_categories WHERE slug = 'returns'), 'Chính sách đổi trả như thế nào?', 'Sản phẩm được đổi trả trong vòng 30 ngày nếu còn nguyên tem mác.', 1),
            ((SELECT id FROM faq_categories WHERE slug = 'products'), 'Làm sao để kiểm tra sản phẩm chính hãng?', 'Tất cả sản phẩm tại TOAN Store đều là chính hãng, có đầy đủ tem và bảo hành.', 1)
        ON DUPLICATE KEY UPDATE question = VALUES(question)`
    },

    // --- Admin User (super_admin) ---
    {
        name: 'admin_users',
        check: 'SELECT COUNT(*) as count FROM admin_users',
        data: `INSERT INTO admin_users (username, email, password, full_name, role) VALUES
            ('admin', 'admin@toanstore.com', '$2b$10$CTpJGqihD7OewkHcHf8rXuvQ/uLWlC3Imm6AoMpIv06db78INhiWi', 'System Administrator', 'super_admin')
        ON DUPLICATE KEY UPDATE username = VALUES(username)`
    },

    // --- Sample Banners ---
    {
        name: 'banners',
        check: 'SELECT COUNT(*) as count FROM banners',
        data: `INSERT INTO banners (title, description, image_url, link_url, link_text, position, display_order) VALUES
            ('Nike Air Max Collection', 'Khám phá bộ sưu tập Air Max mới nhất', 'https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/4f37fca8-6bce-43e7-ad07-f57ae3c13142/nike-just-do-it.png', '/shoes', 'Mua Ngay', 'homepage', 1),
            ('Giảm giá đến 50%', 'Flash Sale cuối năm - Ưu đãi cực lớn', 'https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/23d36c28-01e7-484d-a5d0-cf36209ccdfb/nike-just-do-it.jpg', '/categories', 'Xem Ngay', 'homepage', 2),
            ('Nike Pro Training', 'Trang bị cho tập luyện với dòng Nike Pro', 'https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/fb3a98c1-d98e-44b0-96d4-9c9fe5a1f4e0/nike-just-do-it.jpg', '/clothing', 'Khám Phá', 'homepage', 3)
        ON DUPLICATE KEY UPDATE title = VALUES(title)`
    },

    // --- Sample Coupons ---
    {
        name: 'coupons',
        check: 'SELECT COUNT(*) as count FROM coupons',
        data: `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at, usage_limit, usage_limit_per_user) VALUES
            ('WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'percent', 10.00, NULL, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1000, 1),
            ('SALE50K', 'Giảm 50,000đ cho đơn từ 500,000đ', 'fixed', 50000.00, 500000.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 500, 1),
            ('FREESHIP', 'Miễn phí vận chuyển', 'fixed', 30000.00, 1000000.00, 30000.00, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, NULL)
        ON DUPLICATE KEY UPDATE code = VALUES(code)`
    },

    // --- Sample Gift Cards ---
    {
        name: 'gift_cards',
        check: 'SELECT COUNT(*) as count FROM gift_cards',
        data: `INSERT INTO gift_cards (card_number, pin, initial_balance, current_balance, currency, status, expires_at) VALUES
            ('1234567890123456', '1234', 500000.00, 500000.00, 'VND', 'active', DATE_ADD(NOW(), INTERVAL 1 YEAR)),
            ('9876543210987654', '5678', 1000000.00, 1000000.00, 'VND', 'active', DATE_ADD(NOW(), INTERVAL 1 YEAR)),
            ('1111222233334444', '9999', 250000.00, 250000.00, 'VND', 'active', DATE_ADD(NOW(), INTERVAL 1 YEAR))
        ON DUPLICATE KEY UPDATE card_number = VALUES(card_number)`
    },
];

async function seed() {
    console.log('🌱 Starting database seed...\n');

    for (const table of seeds) {
        try {
            const [result] = await executeQuery<any[]>(table.check);
            const count = result.count || 0;

            if (count > 0) {
                console.log(`⏭️  ${table.name} — already has ${count} rows, skipping`);
                continue;
            }

            await executeQuery(table.data);
            console.log(`✅ ${table.name} — seeded successfully`);
        } catch (error: any) {
            // Table might not exist yet
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.log(`⚠️  ${table.name} — table does not exist, skipping`);
            } else {
                console.error(`❌ ${table.name} — error:`, error.message);
            }
        }
    }

    console.log('\n🌱 Seed completed!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
