# 🚀 HƯỚNG DẪN TRIỂN KHAI (DEPLOY) PROJECT TOAN STORE

Tài liệu này hướng dẫn cách triển khai hệ thống lên máy chủ VPS bằng công nghệ **Docker** để đảm bảo tính ổn định và bảo mật cao nhất với chi phí tối ưu (~350k VNĐ/tháng).

---

## 🏗️ 1. Yêu cầu hệ thống (VPS Recommendation)
Để chạy mượt các dịch vụ (Next.js, MySQL, Redis, Meilisearch, Socket.io), cấu hình đề nghị:
*   **OS**: Ubuntu 22.04 LTS (hoặc 24.04).
*   **CPU**: Tối thiểu 2 Core.
*   **RAM**: Tối thiểu 4GB.
*   **Disk**: 40GB+ SSD.
*   **Nhà cung cấp**: Vultr, Bizfly Cloud, Hetzner, hoặc DigitialOcean.

---

## 🛠️ 2. Chuẩn bị môi trường trên VPS
Sau khi đăng nhập vào VPS qua SSH, hãy chạy lệnh sau để cài đặt Docker:

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker & Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

---

## 📂 3. Cấu hình File `docker-compose.yml`
Tạo một thư mục dự án và tạo file `docker-compose.yml` với nội dung sau:

```yaml
version: '3.8'

services:
  # 1. Cơ sở dữ liệu MySQL
  db:
    image: mysql:8.0
    container_name: toan-store-db
    restart: always
    environment:
      MYSQL_DATABASE: nike_clone
      MYSQL_ROOT_PASSWORD: YourSecretPassword
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - nike-network

  # 2. Redis Cache
  redis:
    image: redis:alpine
    container_name: toan-store-redis
    restart: always
    networks:
      - nike-network

  # 3. Meilisearch (Tìm kiếm)
  meilisearch:
    image: getmeili/meilisearch:latest
    container_name: toan-store-search
    restart: always
    environment:
      - MEILI_MASTER_KEY=YourMasterKey
    networks:
      - nike-network

  # 4. Ứng dụng Next.js
  app:
    build: .
    container_name: toan-store-app
    restart: always
    environment:
      - DATABASE_URL=mysql://root:YourSecretPassword@db:3306/nike_clone
      - REDIS_URL=redis://redis:6379
      - MEILI_HOST=http://meilisearch:7700
      - NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
      - meilisearch
    networks:
      - nike-network

networks:
  nike-network:
    driver: bridge

volumes:
  db_data:
```

---

## 🔒 4. Cấu hình SSL & Reverse Proxy (Caddy)
Sử dụng **Caddy** để tự động cấp chứng chỉ SSL (HTTPS) miễn phí. Cài đặt Caddy trên máy chủ và cấu hình `/etc/caddy/Caddyfile`:

```caddy
yourdomain.com {
    reverse_proxy localhost:3000
    encode gzip
}
```

---

## 📁 5. Các biến môi trường (.env) quan trọng
Trước khi build app, hãy đảm bảo file `.env.production` có đầy đủ thông tin:
*   **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
*   **Email**: `RESEND_API_KEY`.
*   **Payment**: `VNP_TMN_CODE`, `VNP_HASH_SECRET` (Dùng tài liệu VNPay Sandbox nếu chưa có thật).
*   **JWT**: `JWT_SECRET_KEY` (Tạo chuỗi ngẫu nhiên dài).

---

## 🚀 6. Lệnh triển khai nhanh
Trong thư mục dự án, chạy lệnh:

```bash
# 1. Build và chạy các container ngầm
docker-compose up -d --build

# 2. Kiểm tra log nếu có lỗi
docker logs -f toan-store-app
```

---

## 🛡️ 7. Lưu ý bảo trì
1.  **Backup**: Luôn sao lưu thư mục `db_data` định kỳ.
2.  **Cập nhật**: Để cập nhật code mới, chỉ cần chạy `git pull` rồi chạy lại lệnh `docker-compose up -d --build`.
3.  **Bảo mật**: Chỉ mở port 80 và 443 trên Firewall của VPS, port 3306 (MySQL) nên để nội bộ.

---
**Ghi chú**: Nếu bạn cần hỗ trợ cài đặt cụ thể từng câu lệnh trên VPS, hãy nhắn cho tôi!
