-- ============================================================================
-- URGENT FIX: ENCRYPTION IMPLEMENTATION (ROBUST VERSION)
-- ============================================================================

DELIMITER //
CREATE PROCEDURE IF NOT EXISTS AddColumnIfNotExist(
    IN p_table_name VARCHAR(255),
    IN p_column_name VARCHAR(255),
    IN p_column_def TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = p_table_name 
        AND column_name = p_column_name
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD COLUMN ', p_column_name, ' ', p_column_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

CREATE PROCEDURE IF NOT EXISTS AddIndexIfNotExist(
    IN p_table_name VARCHAR(255),
    IN p_index_name VARCHAR(255),
    IN p_column_list VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
        AND table_name = p_table_name 
        AND index_name = p_index_name
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD INDEX ', p_index_name, ' (', p_column_list, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Orders Table
CALL AddColumnIfNotExist('orders', 'shipping_phone_encrypted', 'TEXT AFTER shipping_address_snapshot');
CALL AddColumnIfNotExist('orders', 'shipping_address_encrypted', 'TEXT AFTER shipping_phone_encrypted');
CALL AddColumnIfNotExist('orders', 'billing_phone_encrypted', 'TEXT AFTER billing_address_id');

-- User Addresses Table
CALL AddColumnIfNotExist('user_addresses', 'recipient_name_encrypted', 'TEXT AFTER recipient_name');

-- Users Table
CALL AddColumnIfNotExist('users', 'phone_encrypted', 'TEXT AFTER phone');
CALL AddColumnIfNotExist('users', 'date_of_birth_encrypted', 'TEXT AFTER date_of_birth');
CALL AddColumnIfNotExist('users', 'is_encrypted', 'TINYINT(1) DEFAULT 0 AFTER date_of_birth_encrypted');

-- Indexes
CALL AddIndexIfNotExist('orders', 'idx_is_encrypted', 'is_encrypted');
CALL AddIndexIfNotExist('user_addresses', 'idx_is_encrypted', 'is_encrypted');
CALL AddIndexIfNotExist('users', 'idx_is_encrypted', 'is_encrypted');

-- Cleanup
DROP PROCEDURE IF EXISTS AddColumnIfNotExist;
DROP PROCEDURE IF EXISTS AddIndexIfNotExist;
