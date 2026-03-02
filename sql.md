# TOAN Store - Complete SQL Encyclopedia

Tài liệu này là từ điển SQL đầy đủ cho toàn bộ dự án TOAN Store. Được thiết kế cho việc học chuyên sâu, tài liệu bao gồm từ các CRUD cơ bản đến các Query phức tạp (Aggregation, Subqueries, Full-text Search, và Financial Analytics).

---

## 1. Cơ cấu Sản phẩm & Dữ liệu Gốc (Core Entity Management)

### // 1.1 Lấy Sản phẩm với Metadata (Search & SEO)
```sql
SELECT 
  p.*, s.title as seo_title, s.description as seo_desc
FROM products p
LEFT JOIN seo_metadata s ON s.entity_type = 'product' AND s.entity_id = p.id
WHERE p.is_active = 1 AND p.deleted_at IS NULL;
```

### // 1.2 Quản lý Thuộc tính Động (Dynamic Attributes)
```sql
SELECT a.name, a.slug, pav.value_text, ao.label as option_label
FROM product_attribute_values pav
JOIN attributes a ON pav.attribute_id = a.id
LEFT JOIN attribute_options ao ON pav.option_id = ao.id
WHERE pav.product_id = ?;
```

### // 1.3 Truy vấn Danh mục theo phân cấp
```sql
SELECT c.*, p.name as parent_name 
FROM categories c 
LEFT JOIN categories p ON c.parent_id = p.id 
ORDER BY c.position ASC;
```

---

## 2. Hệ thống Khách hàng & Tương tác (Customer Experience)

### // 2.1 Truy vấn Đánh giá & Thống kê Sao (Reviews Statistics)
```sql
SELECT 
  AVG(rating) as average_rating,
  COUNT(*) as total_reviews,
  SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
  SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
FROM product_reviews 
WHERE product_id = ? AND status = 'approved';
```

### // 2.2 Hệ thống Live Chat CSKH (Support Chat)
```sql
/* Lấy tin nhắn mới nhất của mỗi phiên chat để Admin theo dõi */
SELECT sc.*, 
  (SELECT message FROM support_messages WHERE chat_id = sc.id ORDER BY created_at DESC LIMIT 1) as last_msg
FROM support_chats sc
WHERE status IN ('waiting', 'active')
ORDER BY last_message_at DESC;
```

### // 2.3 Thông báo cá nhân hóa (User Notifications)
```sql
SELECT * FROM notifications 
WHERE user_id = ? AND is_read = FALSE 
ORDER BY created_at DESC LIMIT 20;
```

---

## 3. Khuyến mãi & Voucher (Promotions & Loyalty)

### // 3.1 Kiểm tra Voucher (Hạng thành viên & Giá trị đơn hàng)
```sql
SELECT * FROM coupons 
WHERE code = ? 
  AND (usage_limit IS NULL OR usage_count < usage_limit)
  AND (min_order_amount <= ?)
  AND (applicable_tier IS NULL OR applicable_tier = ?)
  AND (starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW()));
```

### // 3.2 Lịch sử sử dụng mã giảm giá của User
```sql
SELECT cu.*, c.code, c.discount_value, o.order_number
FROM coupon_usage cu
JOIN coupons c ON cu.coupon_id = c.id
JOIN orders o ON cu.order_id = o.id
WHERE cu.user_id = ?;
```

---

## 4. Thanh toán & Giao dịch (Payments & FinTech)

### // 4.1 Log giao dịch VNPAY (IPN Handling)
```sql
INSERT INTO payment_transactions 
(order_id, provider, transaction_id, amount, status, raw_response)
VALUES (?, 'vnpay', ?, ?, ?, ?);
```

### // 4.2 Thẻ quà tặng (Gift Card Transactions)
```sql
INSERT INTO gift_card_transactions 
(gift_card_id, transaction_type, amount, balance_before, balance_after, order_id)
SELECT id, 'redeem', ?, current_balance, (current_balance - ?), ?
FROM gift_cards WHERE card_number = ? AND current_balance >= ?;
```

---

## 5. Quản trị Kho & Vận chuyển (Logistics & Inventory)

### // 5.1 Kiểm kê Tồn kho trên nhiều kho (Multi-Warehouse Inventory)
```sql
SELECT w.name as warehouse, i.quantity, i.reserved, (i.quantity - i.reserved) as available
FROM inventory i
JOIN warehouses w ON i.warehouse_id = w.id
WHERE i.product_variant_id = ?;
```

### // 5.2 Quản lý Lô hàng (Shipment Tracking)
```sql
SELECT s.*, si.product_name, si.quantity, si.sku
FROM shipments s
JOIN shipment_items si ON s.id = si.shipment_id
WHERE s.order_id = ?;
```

---

## 6. Báo cáo Chuyên sâu (Advanced Business Intelligence)

### // 6.1 Top 10 Sản phẩm bán chạy theo doanh thu (Analytics)
```sql
SELECT p.id, p.name, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered' AND o.placed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.id, p.name
ORDER BY total_revenue DESC LIMIT 10;
```

### // 6.2 Phân tích Hạng khách hàng & Chi tiêu
```sql
SELECT membership_tier, COUNT(*) as user_count, AVG(accumulated_points) as avg_points
FROM users GROUP BY membership_tier ORDER BY avg_points DESC;
```

---

## 7. Kỹ thuật & Bảo mật (Engineering & DevOps)

### // 7.1 Xóa dữ liệu PII (GDPR/Security Compliance)
```sql
UPDATE user_addresses 
SET phone = '***', address_line = '***', is_encrypted = TRUE, 
    phone_encrypted = ?, address_encrypted = ?
WHERE is_encrypted = FALSE AND id = ?;
```

### // 7.2 Audit Logs - Theo dõi hành động của Admin
```sql
SELECT a.*, u.full_name as admin_name 
FROM admin_audit_logs a
JOIN users u ON a.admin_id = u.id
WHERE a.target_type = 'product' AND a.target_id = ?
ORDER BY a.created_at DESC;
```

---
*Lưu ý: Hệ thống sử dụng Prepared Statements để ngăn chặn SQL Injection.*
