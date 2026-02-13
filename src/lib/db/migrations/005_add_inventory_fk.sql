-- Migration: 005_add_inventory_fk
-- Description: Add Foreign Key constraint.

ALTER TABLE inventory ADD CONSTRAINT fk_inventory_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id);
