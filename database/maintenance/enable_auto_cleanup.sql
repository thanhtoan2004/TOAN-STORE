SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS cleanup_password_resets;

DELIMITER $$
CREATE EVENT cleanup_password_resets
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 3 HOUR)
DO
BEGIN
  DELETE FROM password_resets WHERE expires_at < UTC_TIMESTAMP();
  DELETE FROM password_resets WHERE used = 1 AND created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY);
END$$
DELIMITER ;

SELECT 'Auto cleanup enabled successfully!' as status;
