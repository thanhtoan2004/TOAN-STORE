-- ============================================================================
-- URGENT FIX: ENCRYPTION IMPLEMENTATION
-- ============================================================================
-- Purpose: Sửa cách lưu encrypted data - tạo cột riêng thay vì lưu vào cột gốc
-- ============================================================================

-- FIX 1: Orders table
ALTER TABLE orders
ADD COLUMN phone_encrypted TEXT AFTER phone,
ADD COLUMN email_encrypted TEXT AFTER email,
ADD COLUMN shipping_phone_encrypted TEXT AFTER shipping_phone,
ADD COLUMN shipping_address_encrypted TEXT AFTER shipping_address_snapshot,
ADD COLUMN billing_phone_encrypted TEXT AFTER billing_address_id,
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE AFTER billing_phone_encrypted;

-- FIX 2: User addresses table
ALTER TABLE user_addresses
ADD COLUMN phone_encrypted TEXT AFTER phone,
ADD COLUMN address_line_encrypted TEXT AFTER address_line,
ADD COLUMN recipient_name_encrypted TEXT AFTER recipient_name,
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE AFTER recipient_name_encrypted;

-- FIX 3: Users table
ALTER TABLE users
ADD COLUMN phone_encrypted TEXT AFTER phone,
ADD COLUMN date_of_birth_encrypted TEXT AFTER date_of_birth,
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE AFTER date_of_birth_encrypted;

-- Add indexes for encrypted columns
ALTER TABLE orders ADD INDEX idx_is_encrypted (is_encrypted);
ALTER TABLE user_addresses ADD INDEX idx_is_encrypted (is_encrypted);
ALTER TABLE users ADD INDEX idx_is_encrypted (is_encrypted);
