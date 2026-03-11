-- ============================================================
-- STEP 5: INFRA & PERFORMANCE
-- ============================================================

START TRANSACTION;

-- PART A: LOG ARCHIVING
CREATE TABLE IF NOT EXISTS archive_security_logs LIKE security_logs;
CREATE TABLE IF NOT EXISTS archive_admin_activity_logs LIKE admin_activity_logs;
CREATE TABLE IF NOT EXISTS archive_search_analytics LIKE search_analytics;

-- A2. Scheduled events
DROP EVENT IF EXISTS evt_archive_security_logs;
CREATE EVENT evt_archive_security_logs
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
DO BEGIN
    INSERT IGNORE INTO archive_security_logs
    SELECT * FROM security_logs
    WHERE created_at < NOW() - INTERVAL 90 DAY;

    DELETE FROM security_logs
    WHERE created_at < NOW() - INTERVAL 90 DAY;
END;

DROP EVENT IF EXISTS evt_archive_admin_logs;
CREATE EVENT evt_archive_admin_logs
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
DO BEGIN
    INSERT IGNORE INTO archive_admin_activity_logs
    SELECT * FROM admin_activity_logs
    WHERE created_at < NOW() - INTERVAL 180 DAY;

    DELETE FROM admin_activity_logs
    WHERE created_at < NOW() - INTERVAL 180 DAY;
END;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- PART B: RATE LIMITING TABLE
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ip_address   VARCHAR(45)     NOT NULL,
    action       VARCHAR(50)     NOT NULL,
    user_id      BIGINT UNSIGNED DEFAULT NULL,
    attempt_count INT            NOT NULL DEFAULT 1,
    window_start  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_until  TIMESTAMP      NULL DEFAULT NULL,
    last_attempt  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ip_action_window (ip_address, action, window_start),
    KEY idx_ip_action         (ip_address, action),
    KEY idx_locked_until      (locked_until),
    KEY idx_window_start      (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
