-- ============================================
-- Password Reset Tokens Cleanup Script
-- ============================================
-- Run this periodically to clean up old tokens
-- Recommended: Weekly or monthly

-- 1. Check current token status
SELECT 
  COUNT(*) as total_tokens,
  SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as used_tokens,
  SUM(CASE WHEN expires_at < UTC_TIMESTAMP() THEN 1 ELSE 0 END) as expired_tokens,
  SUM(CASE WHEN used = 0 AND expires_at > UTC_TIMESTAMP() THEN 1 ELSE 0 END) as active_tokens
FROM password_resets;

-- 2. Preview tokens to be deleted
SELECT 
  id, 
  email, 
  LEFT(token, 20) as token_preview,
  expires_at,
  used,
  created_at,
  CASE 
    WHEN expires_at < UTC_TIMESTAMP() THEN 'EXPIRED'
    WHEN used = 1 THEN 'USED'
    ELSE 'ACTIVE'
  END as status
FROM password_resets
WHERE expires_at < UTC_TIMESTAMP() 
   OR (used = 1 AND created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY))
ORDER BY created_at DESC;

-- 3. Delete expired tokens
DELETE FROM password_resets 
WHERE expires_at < UTC_TIMESTAMP();

-- 4. Delete used tokens older than 7 days (for audit trail)
DELETE FROM password_resets 
WHERE used = 1 AND created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY);

-- 5. Verify cleanup
SELECT 
  COUNT(*) as remaining_tokens,
  SUM(CASE WHEN used = 0 AND expires_at > UTC_TIMESTAMP() THEN 1 ELSE 0 END) as active_tokens
FROM password_resets;

-- ============================================
-- Optional: Schedule automatic cleanup
-- ============================================
-- Create MySQL event for automatic cleanup (runs daily at 3 AM)
-- Uncomment to enable:

/*
CREATE EVENT IF NOT EXISTS cleanup_password_resets
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE, '03:00:00')
DO
BEGIN
  -- Delete expired tokens
  DELETE FROM password_resets WHERE expires_at < UTC_TIMESTAMP();
  
  -- Delete used tokens older than 7 days
  DELETE FROM password_resets WHERE used = 1 AND created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY);
END;
*/

-- Check if event scheduler is enabled
-- SHOW VARIABLES LIKE 'event_scheduler';

-- Enable event scheduler (if not already enabled)
-- SET GLOBAL event_scheduler = ON;

-- View existing events
-- SHOW EVENTS;

-- Disable the event (if needed)
-- ALTER EVENT cleanup_password_resets DISABLE;

-- Drop the event (if needed)  
-- DROP EVENT IF EXISTS cleanup_password_resets;
