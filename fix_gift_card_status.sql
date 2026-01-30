-- Fix gift card status for cards with zero balance
UPDATE gift_cards 
SET status = 'used' 
WHERE current_balance <= 0 AND status = 'active';

-- Verify
SELECT card_number, current_balance, status 
FROM gift_cards 
WHERE current_balance <= 0;
