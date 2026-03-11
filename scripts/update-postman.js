const fs = require('fs');
const file = 'toan-store-api.postman_collection.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Cập nhật Metadata
data.info.name = 'TOAN Store API';
data.info.description =
  'Bộ sưu tập API hoàn chỉnh.\n\nBao gồm:\n- Full PII Masking & Blind Indexing (Email Hash)\n- Cloudinary Media Upload (Hình ảnh, Video Reviews)\n- Rate Limiting, XSS Protection\n- 105+ API Endpoints.';

// Duyệt tìm các nhóm để thêm/sửa Endpoint
const shopGroup = data.item.find((i) => i.name === '2. Shop & Products');
if (shopGroup) {
  // Tìm hoặc tạo nhóm Reviews
  let reviewGroup = shopGroup.item.find((i) => i.name === 'Reviews');
  if (!reviewGroup) {
    reviewGroup = { name: 'Reviews', item: [] };
    shopGroup.item.push(reviewGroup);
  }

  // Xóa Upload cũ nếu có để tránh trùng
  reviewGroup.item = reviewGroup.item.filter((i) => !i.name.includes('Upload'));

  // Thêm API Upload
  reviewGroup.item.push({
    name: 'Upload Review Media (Cloudinary)',
    request: {
      method: 'POST',
      header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
      body: {
        mode: 'formdata',
        formdata: [{ key: 'file', type: 'file', src: [] }],
      },
      url: {
        raw: '{{baseUrl}}/api/reviews/upload',
        host: ['{{baseUrl}}'],
        path: ['api', 'reviews', 'upload'],
      },
      description: 'Upload file lên Cloudinary: Image (<5MB), Video (<50MB).',
    },
  });
}

const authGroup = data.item.find((i) => i.name === '1. Auth & User');
if (authGroup) {
  let baseAuth = authGroup.item.find((i) => i.name === 'Authentication');
  if (baseAuth) {
    let resetPwd = baseAuth.item.find((i) => i.name === 'Đặt lại mật khẩu');
    if (resetPwd) {
      resetPwd.request.description =
        'Cập nhật Phase 17: Sử dụng email_hash (Blind Index) để tìm kiếm User an toàn thay vì lưu Email trực tiếp.';
    }
  }
}

const fileOrders = data.item
  .find((i) => i.name === '2. Shop & Products')
  ?.item?.find((i) => i.name === 'Orders');
if (fileOrders) {
  let lookupOrder = fileOrders.item.find(
    (i) => i.name === 'Tra cứu đơn (Lookup)' || i.name.includes('Lookup')
  );
  if (lookupOrder) {
    lookupOrder.request.description =
      'Cập nhật Phase 17: Kiểm tra qua mã băm _hash của Email thay vì Email gốc (Tránh lộ PII).';
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 4));
console.log('✅ Postman Collection Updated! Mở file để xem thay đổi.');
