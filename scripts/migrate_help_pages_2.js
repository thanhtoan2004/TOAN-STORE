const mysql = require('mysql2/promise');

async function migrate() {
  const c = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    const pagesToMigrate = [
      {
        slug: 'ordering',
        title: 'Hướng Dẫn Đặt Hàng',
        content: `
          <div class="space-y-8">
            <section class="border-l-4 border-black pl-6 py-2">
              <h2 class="text-2xl font-bold mb-2 text-gray-900">1. Tìm Kiếm Sản Phẩm</h2>
              <p class="text-gray-600">Sử dụng thanh tìm kiếm hoặc duyệt qua các danh mục (Nam, Nữ, Trẻ Em) để tìm sản phẩm bạn yêu thích. Bạn có thể lọc theo size, màu sắc, giá cả và môn thể thao.</p>
              <div class="mt-2 text-sm italic text-gray-500 bg-gray-50 p-3 rounded">Mẹo: Kiểm tra bảng size ở trang chi tiết sản phẩm để chọn kích cỡ phù hợp nhất.</div>
            </section>
            <section class="border-l-4 border-gray-300 pl-6 py-2 mt-8">
              <h2 class="text-2xl font-bold mb-2 text-gray-900">2. Thêm Vào Giỏ Hàng</h2>
              <p class="text-gray-600">Chọn size và số lượng, sau đó nhấn nút "Thêm vào giỏ hàng". Bạn có thể tiếp tục mua sắm hoặc đi đến giỏ hàng để kiểm tra lại các sản phẩm.</p>
            </section>
            <section class="border-l-4 border-gray-300 pl-6 py-2 mt-8">
              <h2 class="text-2xl font-bold mb-2 text-gray-900">3. Thanh Toán</h2>
              <p class="text-gray-600">Nhập thông tin giao hàng và chọn phương thức thanh toán. Chúng tôi chấp nhận COD, Thẻ tín dụng, Chuyển khoản và Ví điện tử (Momo, ZaloPay).</p>
            </section>
            <section class="border-l-4 border-gray-300 pl-6 py-2 mt-8">
              <h2 class="text-2xl font-bold mb-2 text-gray-900">4. Xác Nhận & Giao Hàng</h2>
              <p class="text-gray-600">Bạn sẽ nhận được email xác nhận đơn hàng ngay lập tức. Chúng tôi sẽ thông báo khi đơn hàng được gửi đi cùng mã vận đơn để bạn theo dõi.</p>
            </section>
          </div>
        `,
        metaTitle: 'Hướng Dẫn Đặt Hàng - TOAN Store',
        metaDescription: 'Cách thức đặt hàng đơn giản và nhanh chóng tại TOAN Store.',
      },
      {
        slug: 'size-guide',
        title: 'Hướng Dẫn Chọn Size',
        content: `
          <h2 class="text-2xl font-bold mb-6 border-b pb-2">Bảng quy đổi Size chuẩn</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-gray-100"><th class="border p-2">US Men</th><th class="border p-2">US Women</th><th class="border p-2">EU</th><th class="border p-2">CM</th></tr>
              </thead>
              <tbody>
                <tr><td class="border p-2 text-center">4</td><td class="border p-2 text-center">5.5</td><td class="border p-2 text-center">36</td><td class="border p-2 text-center">23</td></tr>
                <tr><td class="border p-2 text-center">5</td><td class="border p-2 text-center">6.5</td><td class="border p-2 text-center">37.5</td><td class="border p-2 text-center">23.5</td></tr>
                <tr><td class="border p-2 text-center">6</td><td class="border p-2 text-center">7.5</td><td class="border p-2 text-center">38.5</td><td class="border p-2 text-center">24</td></tr>
                <tr><td class="border p-2 text-center">7</td><td class="border p-2 text-center">8.5</td><td class="border p-2 text-center">40</td><td class="border p-2 text-center">25</td></tr>
                <tr><td class="border p-2 text-center">8</td><td class="border p-2 text-center">9.5</td><td class="border p-2 text-center">41</td><td class="border p-2 text-center">26</td></tr>
              </tbody>
            </table>
          </div>
          <div class="mt-8">
            <h2 class="text-2xl font-bold mb-4 border-b pb-2">Cách đo chân tại nhà</h2>
            <ul class="list-decimal pl-5 space-y-2">
              <li>Đứng thẳng trên một bề mặt cứng với gót chân dựa vào tường.</li>
              <li>Đo từ gót chân đến ngón chân dài nhất của bạn.</li>
              <li>Sử dụng bảng quy đổi trên để tìm kích cỡ phù hợp.</li>
            </ul>
          </div>
        `,
        metaTitle: 'Hướng Dẫn Chọn Size - TOAN Store',
        metaDescription: 'Bảng quy đổi size giày nam và nữ chuẩn tại TOAN Store.',
      },
    ];

    for (const page of pagesToMigrate) {
      const [existing] = await c.execute('SELECT id FROM pages WHERE slug = ?', [page.slug]);
      if (existing.length > 0) {
        await c.execute(
          'UPDATE pages SET title = ?, content = ?, meta_title = ?, meta_description = ?, is_active = 1 WHERE slug = ?',
          [page.title, page.content, page.metaTitle, page.metaDescription, page.slug]
        );
      } else {
        await c.execute(
          'INSERT INTO pages (title, slug, content, meta_title, meta_description, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [page.title, page.slug, page.content, page.metaTitle, page.metaDescription]
        );
      }
      console.log(`Processed page: ${page.slug}`);
    }
  } finally {
    await c.end();
  }
}

migrate();
