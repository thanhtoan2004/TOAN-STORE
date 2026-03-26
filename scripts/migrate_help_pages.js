const mysql = require('mysql2/promise');

async function migrate() {
  const c = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    const pagesToMigrate = [
      {
        slug: 'returns',
        title: 'Chính Sách Trả Hàng',
        content: `
          <section>
            <h2 class="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Thời Gian Trả Hàng</h2>
            <p>Bạn có thể trả hàng trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng. Sản phẩm phải còn nguyên vẹn, chưa sử dụng và còn đầy đủ nhãn mác, hộp đựng.</p>
          </section>
          <section class="mt-6">
            <h2 class="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Điều Kiện Trả Hàng</h2>
            <ul class="list-disc pl-5 space-y-2">
              <li>Sản phẩm phải còn nguyên vẹn, chưa sử dụng</li>
              <li>Còn đầy đủ nhãn mác, thẻ giá gốc</li>
              <li>Còn hộp đựng và tài liệu kèm theo (nếu có)</li>
              <li>Không bị hư hỏng, bẩn hoặc có mùi</li>
              <li>Chưa giặt hoặc sử dụng</li>
            </ul>
          </section>
          <section class="mt-6">
            <h2 class="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Cách Thức Trả Hàng</h2>
            <div class="space-y-4">
              <div>
                <h3 class="font-bold">Bước 1: Liên hệ với chúng tôi</h3>
                <p>Đăng nhập vào tài khoản và truy cập trang <a href="/orders" class="text-black underline">Đơn Hàng</a> để yêu cầu trả hàng.</p>
              </div>
              <div>
                <h3 class="font-bold"> Bước 2: Đóng gói sản phẩm</h3>
                <p>Đóng gói sản phẩm cẩn thận trong hộp đựng gốc (nếu có).</p>
              </div>
            </div>
          </section>
          <section class="mt-6">
            <h2 class="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Hoàn Tiền</h2>
            <p>Sau khi nhận và kiểm tra sản phẩm trả về, chúng tôi sẽ hoàn tiền cho bạn trong vòng <strong>5-7 ngày làm việc</strong>. Tiền sẽ được hoàn lại theo phương thức thanh toán ban đầu.</p>
          </section>
        `,
        metaTitle: 'Chính Sách Trả Hàng - TOAN Store',
        metaDescription: 'Thông tin chi tiết về chính sách trả hàng và hoàn tiền tại TOAN Store.',
      },
      {
        slug: 'shipping-delivery',
        title: 'Vận Chuyển Và Giao Hàng',
        content: `
          <section>
            <h2 class="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Phí Vận Chuyển</h2>
            <ul class="list-disc pl-5 space-y-2">
              <li>Miễn phí vận chuyển cho đơn hàng trên <strong>1.000.000 ₫</strong></li>
              <li>Phí vận chuyển <strong>30.000 ₫</strong> cho đơn hàng dưới 1.000.000 ₫</li>
              <li>Áp dụng cho tất cả các đơn hàng trong nước</li>
            </ul>
          </section>
          <section class="mt-6">
            <h2 class="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Thời Gian Giao Hàng</h2>
            <div class="space-y-4">
              <div>
                <h3 class="font-bold">Khu vực TP. Hồ Chí Minh và Hà Nội:</h3>
                <p>1-2 ngày làm việc</p>
              </div>
              <div>
                <h3 class="font-bold">Các tỉnh thành khác:</h3>
                <p>3-5 ngày làm việc</p>
              </div>
            </div>
          </section>
        `,
        metaTitle: 'Vận Chuyển Và Giao Hàng - TOAN Store',
        metaDescription: 'Thông tin về phí vận chuyển và thời gian giao hàng tại TOAN Store.',
      },
      {
        slug: 'payment-options',
        title: 'Tùy Chọn Thanh Toán',
        content: `
          <section>
            <h2 class="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Các Phương Thức Thanh Toán</h2>
            <div class="space-y-4">
              <div class="border-l-4 border-black pl-4 py-1">
                <h3 class="font-bold">Thanh Toán Khi Nhận Hàng (COD)</h3>
                <p>Thanh toán bằng tiền mặt khi nhận hàng. Phương thức này phù hợp cho tất cả các đơn hàng.</p>
              </div>
              <div class="border-l-4 border-gray-300 pl-4 py-1">
                <h3 class="font-bold">Chuyển Khoản Ngân Hàng</h3>
                <p>Chuyển khoản trực tiếp vào tài khoản ngân hàng của chúng tôi. Thông tin tài khoản sẽ được gửi qua email sau khi đặt hàng.</p>
              </div>
              <div class="border-l-4 border-gray-300 pl-4 py-1">
                <h3 class="font-bold">Ví Điện Tử (MoMo, ZaloPay)</h3>
                <p>Thanh toán nhanh chóng và tiện lợi qua các ví điện tử phổ biến.</p>
              </div>
            </div>
          </section>
        `,
        metaTitle: 'Tùy Chọn Thanh Toán - TOAN Store',
        metaDescription: 'Các phương thức thanh toán linh hoạt tại TOAN Store.',
      },
    ];

    for (const page of pagesToMigrate) {
      // Check if exists
      const [existing] = await c.execute('SELECT id FROM pages WHERE slug = ?', [page.slug]);
      if (existing.length > 0) {
        await c.execute(
          'UPDATE pages SET title = ?, content = ?, meta_title = ?, meta_description = ?, is_active = 1 WHERE slug = ?',
          [page.title, page.content, page.metaTitle, page.metaDescription, page.slug]
        );
        console.log(`Updated page: ${page.slug}`);
      } else {
        await c.execute(
          'INSERT INTO pages (title, slug, content, meta_title, meta_description, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [page.title, page.slug, page.content, page.metaTitle, page.metaDescription]
        );
        console.log(`Inserted page: ${page.slug}`);
      }
    }

    console.log('Migration completed successfully!');
  } finally {
    await c.end();
  }
}

migrate();
