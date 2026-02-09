import { pool } from '../src/lib/db/mysql';

async function migrate() {
    try {
        console.log('Creating faqs table...');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS faqs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                keywords TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed data
        const faqs = [
            {
                question: 'Chính sách đổi trả như thế nào?',
                answer: 'Bạn có thể đổi trả sản phẩm trong vòng 30 ngày kể từ ngày mua. Sản phẩm phải còn nguyên tem mác và chưa qua sử dụng. Vui lòng mang theo hóa đơn khi đổi trả.',
                keywords: 'đổi trả, hoàn tiền, return, refund, 30 ngày'
            },
            {
                question: 'Phí giao hàng là bao nhiêu?',
                answer: 'Chúng tôi miễn phí giao hàng cho đơn hàng từ 5.000.000 VNĐ trở lên. Với đơn hàng dưới 5 triệu, phí giao hàng tiêu chuẩn là 30.000 VNĐ.',
                keywords: 'giao hàng, ship, vận chuyển, delivery, phí'
            },
            {
                question: 'Thời gian giao hàng bao lâu?',
                answer: 'Thời gian giao hàng tiêu chuẩn là 2-4 ngày làm việc. Với khu vực nội thành Hà Nội và TP.HCM có thể nhận trong ngày hoặc ngày hôm sau.',
                keywords: 'thời gian, bao lâu, khi nào nhận'
            },
            {
                question: 'Làm sao để chọn size giày đúng?',
                answer: 'Bạn nên đo chiều dài bàn chân và cộng thêm 1cm. Sau đó so sánh với bảng size của Nike. Nếu chân bè ngang, bạn nên tăng thêm 0.5 size.',
                keywords: 'size, kích thước, đo chân, chọn size'
            },
            {
                question: 'Sản phẩm có được bảo hành không?',
                answer: 'Tất cả giày Nike chính hãng được bảo hành keo và chỉ trong vòng 6 tháng. Lỗi do nhà sản xuất sẽ được đổi mới 1-1.',
                keywords: 'bảo hành, warranty, hỏng, lỗi'
            },
            {
                question: 'Cửa hàng có mở cửa chủ nhật không?',
                answer: 'Cửa hàng mở cửa tất cả các ngày trong tuần từ 9:00 sáng đến 10:00 tối, bao gồm cả Chủ Nhật và ngày lễ.',
                keywords: 'giờ làm việc, mở cửa, chủ nhật, thời gian'
            },
            {
                question: 'Tôi có thể thanh toán bằng thẻ tín dụng không?',
                answer: 'Có, chúng tôi chấp nhận thanh toán bằng tiền mặt, chuyển khoản ngân hàng, thẻ Visa/Mastercard và VNPay.',
                keywords: 'thanh toán, trả tiền, thẻ, visa, credit'
            }
        ];

        console.log('Seeding FAQs...');
        for (const faq of faqs) {
            // Check if exists
            const [rows]: any = await pool.query('SELECT id FROM faqs WHERE question = ? LIMIT 1', [faq.question]);
            if (rows.length === 0) {
                await pool.execute(
                    'INSERT INTO faqs (question, answer, keywords) VALUES (?, ?, ?)',
                    [faq.question, faq.answer, faq.keywords]
                );
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
