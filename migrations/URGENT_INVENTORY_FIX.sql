-- ============================================================================
-- URGENT FIX: NEGATIVE INVENTORY VALUES
-- ============================================================================

-- Fix 1: Set negative quantities to 0
UPDATE inventory SET quantity = 0 WHERE quantity < 0;
UPDATE inventory SET reserved = 0 WHERE reserved < 0;
UPDATE inventory SET reserved = quantity WHERE reserved > quantity;

-- Add CHECK constraints (MySQL 8.0.16+)
ALTER TABLE inventory ADD CONSTRAINT chk_inventory_quantity_non_negative CHECK (quantity >= 0);
ALTER TABLE inventory ADD CONSTRAINT chk_inventory_reserved_non_negative CHECK (reserved >= 0);
ALTER TABLE inventory ADD CONSTRAINT chk_inventory_reserved_not_exceed CHECK (reserved <= quantity);

-- Triggers for safety
DELIMITER //

CREATE TRIGGER trg_inventory_before_update
BEFORE UPDATE ON inventory
FOR EACH ROW
BEGIN
    IF NEW.quantity < 0 THEN SET NEW.quantity = 0; END IF;
    IF NEW.reserved < 0 THEN SET NEW.reserved = 0; END IF;
    IF NEW.reserved > NEW.quantity THEN SET NEW.reserved = NEW.quantity; END IF;
END//

CREATE TRIGGER trg_inventory_before_insert
BEFORE INSERT ON inventory
FOR EACH ROW
BEGIN
    IF NEW.quantity < 0 THEN SET NEW.quantity = 0; END IF;
    IF NEW.reserved < 0 THEN SET NEW.reserved = 0; END IF;
    IF NEW.reserved > NEW.quantity THEN SET NEW.reserved = NEW.quantity; END IF;
END//

DELIMITER ;
