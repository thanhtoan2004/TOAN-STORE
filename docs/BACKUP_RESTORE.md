# 🗄️ Database Backup & Restore Guide

## Automated Backup (Production)

### MySQL Backup Script

```bash
#!/bin/bash
# backup.sh — Chạy hàng ngày bằng cron

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
DB_NAME="toan_store"

mkdir -p $BACKUP_DIR

# Full backup với compression
mysqldump -u $DB_USER -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  $DB_NAME | gzip > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Giữ lại 30 ngày gần nhất
find $BACKUP_DIR -type f -mtime +30 -delete

echo "✅ Backup completed: ${DB_NAME}_${TIMESTAMP}.sql.gz"
```

### Cron Schedule (Backup tự động mỗi ngày 2h sáng)

```bash
# crontab -e
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

---

## Docker Backup

### MySQL Container

```bash
# Backup
docker exec toan-store-db mysqldump -u root toan_store | gzip > backup_$(date +%F).sql.gz

# Restore
gunzip < backup_2026-03-04.sql.gz | docker exec -i toan-store-db mysql -u root toan_store
```

### Redis Container

```bash
# Backup (RDB snapshot)
docker exec toan-store-redis redis-cli BGSAVE
docker cp toan-store-redis:/data/dump.rdb ./redis_backup_$(date +%F).rdb

# Restore
docker cp ./redis_backup.rdb toan-store-redis:/data/dump.rdb
docker restart toan-store-redis
```

### Meilisearch

```bash
# Backup (dump)
curl -X POST 'http://localhost:7700/dumps' -H 'Authorization: Bearer masterKey'

# Tạo snapshot
curl -X POST 'http://localhost:7700/snapshots' -H 'Authorization: Bearer masterKey'
```

---

## Manual Restore

### Step 1: Stop Application

```bash
docker compose stop app  # Nếu dùng Docker
pm2 stop toan-store      # Nếu dùng PM2
```

### Step 2: Restore MySQL

```bash
mysql -u root -p toan_store < backup_file.sql
```

### Step 3: Verify Data

```bash
mysql -u root -p toan_store -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM orders; SELECT COUNT(*) FROM products;"
```

### Step 4: Re-sync Meilisearch

```bash
npm run meilisearch:sync
```

### Step 5: Start Application

```bash
docker compose up -d app
pm2 start toan-store
```

---

| Cloudinary images | N/A | Managed by Cloudinary |

## 🧪 Restore Verification Checklist

Để đảm bảo RPO và RTO, quy trình phục hồi phải được kiểm tra định kỳ trong môi trường biệt lập (Staging/Isolated):

- [ ] **Monthly Test Restore**: Thực hiện restore bản backup gần nhất vào DB Staging.
- [ ] **Row Count Validation**: So sánh số lượng record giữa Production và Staging (users, orders, products).
- [ ] **PII Decryption Check**: Xác nhận dữ liệu nhạy cảm (email, phone) có thể giải mã bằng `ENCRYPTION_KEY` của môi trường mới.
- [ ] **Triggers & Procedures**: Kiểm tra các Triggers (metrics, logs) và Stored Procedures hoạt động chính xác.
- [ ] **Data Integrity**: Kiểm tra các quan hệ Foreign Key không bị mồ côi (orphaned cases).
- [ ] **App Connection**: Đảm bảo ứng dụng (Staging) có thể kết nối và truy vấn bình thường sau restore.
- [ ] **RTO Benchmarking**: Ghi lại thời gian thực hiện phục hồi (Mục tiêu < 30 phút).

> [!IMPORTANT]
> Không bao giờ thực hiện kiểm tra restore trực tiếp lên Database Production. Always use an isolated instance.

## Disaster Recovery

1. **RTO (Recovery Time Objective):** < 30 minutes
2. **RPO (Recovery Point Objective):** < 24 hours (daily backup)
3. **Backup Storage:** Khuyến nghị dùng AWS S3 hoặc Google Cloud Storage với versioning enabled
4. **Encryption:** Backup files nên được mã hóa (gpg) trước khi upload lên cloud:
   ```bash
   gpg --symmetric --cipher-algo AES256 backup.sql.gz
   ```
