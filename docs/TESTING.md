# TESTING.md — Hướng dẫn kiểm thử

> Tài liệu này hướng dẫn cách chạy, viết và duy trì các bài kiểm thử cho dự án TOAN Store.

---

## 🧪 Chiến lược kiểm thử

Chúng tôi áp dụng mô hình Kim tự tháp kiểm thử (Testing Pyramid):

- **Unit Tests (70%)**: Kiểm tra logic hàm, utility (Vitest).
- **Integration Tests (20%)**: Kiểm tra kết nối DB, API logic.
- **E2E Tests (10%)**: Kiểm tra luồng người dùng trên trình duyệt (Playwright).

## 📁 Cấu trúc thư mục

```
src/
├── __tests__/           # Unit tests cho core logic
│   ├── unit/
│   │   ├── point-logic.test.ts
│   │   └── encryption.test.ts
│   └── integration/
│       └── api-orders.test.ts
├── app/
│   └── .../*.test.ts    # Component tests (nếu có)
└── e2e/                 # Playwright E2E tests
    ├── checkout.spec.ts
    └── auth.spec.ts
```

## 🚀 Lệnh chạy test

### 1. Chạy Unit & Integration tests

```bash
npm run test          # Chạy tất cả tests
npm run test:watch    # Chạy ở chế độ watch
npm run test:ui       # Giao diện trực quan Vitest
```

### 2. Chạy E2E tests

```bash
npx playwright test               # Chạy headless
npx playwright test --ui         # Giao diện trực quan Playwright
npx playwright show-report       # Xem báo cáo sau khi chạy
```

### 3. Kiểm tra độ bao phủ (Coverage)

```bash
npm run test:coverage
```

_Mục tiêu: > 80% coverage cho core business logic._

## 📝 Quy chuẩn viết test

1. **Đặt tên**: `[tên_file].test.ts` hoặc `[tên_file].spec.ts`.
2. **Cấu trúc**: Sử dụng khối `describe`, `it` (hoặc `test`), và `expect`.
3. **Mocking**:
   - Sử dụng `vi.mock()` cho các phụ thuộc bên ngoài (Email, Payment Gateway).
   - Không mock Database trong integration tests — sử dụng Test DB riêng.
4. **Dữ liệu mẫu (Fixtures)**:
   - Sử dụng `src/__tests__/fixtures/` để lưu trữ dữ liệu mẫu.

## 🛠️ Công cụ hỗ trợ

- **Vitest**: Runner nhanh, tương thích Vite/Next.
- **Playwright**: Kiểm thử trình duyệt chéo (Chrome, Firefox, Safari).
- **MSW (Mock Service Worker)**: Giả lập API cho frontend tests.
