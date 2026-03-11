const fs = require('fs');
const path = require('path');

const collectionFile = 'toan-store-api.postman_collection.json';
const data = JSON.parse(fs.readFileSync(collectionFile, 'utf8'));

// Lấy tất cả routes từ file Postman
const postmanRoutes = new Set();
function extractRoutes(items) {
  items.forEach((item) => {
    if (item.request && item.request.url && Array.isArray(item.request.url.path)) {
      let pathStr = '/' + item.request.url.path.join('/');

      // Chuẩn hóa param động: vd /api/products/123 -> /api/products/:id
      pathStr = pathStr
        .replace(/\/[a-zA-Z0-9_\-]+-id/g, '/:id')
        .replace(/\/:[a-zA-Z0-9_]+/g, '/:id')
        .replace(/\/[0-9]+(?=\/|$)/g, '/:id')
        .replace(/\/\[[a-zA-Z0-9_]+\]/g, '/:id');

      postmanRoutes.add(pathStr);
    }
    if (item.item) extractRoutes(item.item);
  });
}
extractRoutes(data.item);

// Quét thư mục src/app/api để tìm tất cả code router Next.js
const codeRoutes = [];
function findCodeRoutes(dir, currentPath = '/api') {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findCodeRoutes(fullPath, `${currentPath}/${file}`);
    } else if (file === 'route.ts' || file === 'route.js') {
      // route = /api/products/[id]
      codeRoutes.push(currentPath);
    }
  }
}
findCodeRoutes('src/app/api');

// So sánh bù trừ
const missing = [];
const ignored = ['auth/google', 'auth/facebook', 'payment/momo/ipn', 'payment/vnpay/return'];

codeRoutes.forEach((codeRoute) => {
  // Bỏ qua các file rỗng / không chạy / test IPN
  if (ignored.some((i) => codeRoute.includes(i))) return;

  // Chuẩn hóa biến dynamic route của Next: /[id] -> /:id hoặc bỏ đi để string compare
  let cleanCodeRoute = codeRoute.replace(/\/\[[a-zA-Z0-9_]+\]/g, '/:id');

  // Tìm trong Postman Routes
  let found = false;
  for (const pRoute of postmanRoutes) {
    if (
      pRoute === cleanCodeRoute ||
      pRoute.replace('/:id', '') === cleanCodeRoute.replace('/:id', '') ||
      cleanCodeRoute.startsWith(pRoute.replace('/:id', ''))
    ) {
      found = true;
      break;
    }
  }

  if (!found) {
    missing.push(codeRoute);
  }
});

console.log('============= CHECK POSTMAN COVERAGE =============');
console.log(`- Routes trong Postman: ${postmanRoutes.size}`);
console.log(`- Routes đang code: ${codeRoutes.length}`);
console.log('');

if (missing.length === 0) {
  console.log('✅ CHÚC MỪNG: POSTMAN ĐÃ BAO PHỦ 100% CÁC API ROUTE CỦA BẠN!');
} else {
  console.log(`❌ CẢNH BÁO: Postman đang thiếu ${missing.length} API Routes:`);
  missing.forEach((r) => console.log(`   - ${r}`));
}
