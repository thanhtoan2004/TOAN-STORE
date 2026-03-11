-- Fix warehouse ID type to match inventory.warehouse_id for Foreign Key compatibility
ALTER TABLE warehouses MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
