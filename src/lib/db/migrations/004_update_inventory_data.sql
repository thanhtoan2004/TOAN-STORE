-- Migration: 004_update_inventory_data
-- Description: Set default warehouse_id for existing rows.

UPDATE inventory SET warehouse_id = 1 WHERE warehouse_id IS NULL;
