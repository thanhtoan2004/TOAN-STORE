-- ============================================================
-- STEP 4: PERMANENT GIFTCARD SECURITY (PCI-DSS)
-- ============================================================

START TRANSACTION;

-- 4A. Add new secure columns (if not exist)
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='gift_cards' AND COLUMN_NAME='card_number_hash' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE gift_cards ADD COLUMN card_number_hash VARCHAR(64) AFTER id', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='gift_cards' AND COLUMN_NAME='card_number_last4' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE gift_cards ADD COLUMN card_number_last4 CHAR(4) AFTER card_number_hash', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4B. Migrate data: card_number -> hash/last4 (CONDITIONAL)
-- Only hash if card_number is still there and hash is empty.
SET @has_plaintext = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='gift_cards' AND COLUMN_NAME='card_number' AND TABLE_SCHEMA=DATABASE());

SET @s = (SELECT IF(@has_plaintext > 0, 
    'UPDATE gift_cards SET card_number_hash = SHA2(card_number, 256), card_number_last4 = RIGHT(card_number, 4) WHERE card_number IS NOT NULL AND (card_number_hash IS NULL OR card_number_hash = "")', 
    'SELECT "Already hashed or plaintext gone"'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4C. Update orders.giftcard_id from giftcard_number (CONDITIONAL)
SET @has_order_plaintext = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='giftcard_number' AND TABLE_SCHEMA=DATABASE());

SET @s = (SELECT IF(@has_order_plaintext > 0 AND @has_plaintext > 0,
    'UPDATE orders o JOIN gift_cards gc ON o.giftcard_number = gc.card_number SET o.giftcard_id = gc.id WHERE o.giftcard_id IS NULL AND o.giftcard_number IS NOT NULL',
    'SELECT "Order giftcard already migrated or source gone"'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4D. Enforce giftcard_id FK
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='fk_orders_giftcard_id' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE orders ADD CONSTRAINT fk_orders_giftcard_id FOREIGN KEY (giftcard_id) REFERENCES gift_cards (id) ON DELETE SET NULL', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4E. Final Security: DROP plaintext card_number
-- IMPORTANT: Un-comment only after verifying data migration.
SET @s = (SELECT IF(@has_plaintext > 0, 'ALTER TABLE gift_cards DROP COLUMN card_number', 'SELECT "Already dropped"'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(@has_order_plaintext > 0, 'ALTER TABLE orders DROP COLUMN giftcard_number', 'SELECT "Already dropped from orders"'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4F. Verification
SELECT id, card_number_hash, card_number_last4 FROM gift_cards LIMIT 5;

COMMIT;
