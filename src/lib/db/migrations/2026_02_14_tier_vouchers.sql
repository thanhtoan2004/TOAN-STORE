-- Add applicable_tier column to coupons and vouchers
-- Tier order: bronze < silver < gold < platinum

ALTER TABLE coupons 
ADD COLUMN applicable_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze' 
AFTER discount_value;

ALTER TABLE vouchers 
ADD COLUMN applicable_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze' 
AFTER value;

-- Update existing data if needed (defaulting to bronze allows everyone to use existing ones)
-- Optional: If we want to strictly enforce tiers for existing vouchers, we can set them here.
