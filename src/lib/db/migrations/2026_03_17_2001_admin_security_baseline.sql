-- Add security and 2FA fields to admin_users table
ALTER TABLE admin_users 
ADD COLUMN failed_login_attempts INT DEFAULT 0,
ADD COLUMN lockout_until TIMESTAMP NULL,
ADD COLUMN two_factor_secret TEXT NULL,
ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0,
ADD COLUMN two_factor_type VARCHAR(20) DEFAULT 'email',
ADD COLUMN two_factor_backup_codes JSON NULL;
