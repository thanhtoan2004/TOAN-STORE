-- ============================================================================
-- PERFORMANCE OPTIMIZATION: MISSING INDEXES
-- ============================================================================

ALTER TABLE orders ADD INDEX idx_user_status_created (user_id, status, created_at DESC);
ALTER TABLE orders ADD INDEX idx_status_created (status, created_at DESC);
ALTER TABLE orders ADD INDEX idx_payment_status_created (payment_status, created_at DESC);
ALTER TABLE orders ADD INDEX idx_tracking_carrier (tracking_number, carrier);

ALTER TABLE order_items ADD INDEX idx_product_created (product_id, created_at DESC);
ALTER TABLE order_items ADD INDEX idx_inventory_order (inventory_id, order_id);

ALTER TABLE inventory ADD INDEX idx_warehouse_quantity (warehouse_id, quantity);
ALTER TABLE inventory ADD INDEX idx_quantity_reserved (quantity, reserved);
ALTER TABLE inventory ADD INDEX idx_variant_warehouse (product_variant_id, warehouse_id);

ALTER TABLE products ADD INDEX idx_category_active_created (category_id, is_active, created_at DESC);
ALTER TABLE products ADD INDEX idx_featured_active (is_featured, is_active);
ALTER TABLE products ADD INDEX idx_brand_active (brand_id, is_active);
ALTER TABLE products ADD INDEX idx_new_arrival_created (is_new_arrival, created_at DESC);

ALTER TABLE product_variants ADD INDEX idx_product_size (product_id, size);
ALTER TABLE product_variants ADD INDEX idx_product_color (product_id, color);
ALTER TABLE product_variants ADD INDEX idx_price (price);

ALTER TABLE product_reviews ADD INDEX idx_product_approved_created (product_id, status, created_at DESC);
ALTER TABLE product_reviews ADD INDEX idx_product_rating (product_id, rating DESC);
ALTER TABLE product_reviews ADD INDEX idx_user_created (user_id, created_at DESC);

ALTER TABLE search_analytics ADD INDEX idx_query_created (query, created_at DESC);
ALTER TABLE search_analytics ADD INDEX idx_category_created (category_filter, created_at DESC);
ALTER TABLE search_analytics ADD INDEX idx_user_created (user_id, created_at DESC);

ALTER TABLE notifications ADD INDEX idx_user_type_read (user_id, type, is_read);
ALTER TABLE notifications ADD INDEX idx_user_unread_created (user_id, is_read, created_at DESC);

ALTER TABLE coupons ADD INDEX idx_code_dates (code, starts_at, ends_at);
ALTER TABLE coupons ADD INDEX idx_tier_dates (applicable_tier, starts_at, ends_at);
ALTER TABLE vouchers ADD INDEX idx_status_valid (status, valid_until);

ALTER TABLE users ADD INDEX idx_email_verified (email, is_verified);
ALTER TABLE users ADD INDEX idx_tier_points (membership_tier, accumulated_points DESC);
ALTER TABLE users ADD INDEX idx_active_created (is_active, created_at DESC);

ALTER TABLE support_chats ADD INDEX idx_status_last_message (status, last_message_at DESC);
ALTER TABLE support_chats ADD INDEX idx_assigned_status (assigned_admin_id, status);
ALTER TABLE support_messages ADD INDEX idx_chat_created (chat_id, created_at ASC);

ALTER TABLE gift_cards ADD INDEX idx_status_expires (status, expires_at);
ALTER TABLE gift_cards ADD INDEX idx_card_status (card_number, status);

ALTER TABLE flash_sales ADD INDEX idx_active_dates (status, start_time, end_time);
ALTER TABLE flash_sale_items ADD INDEX idx_sale_product (flash_sale_id, product_id);

ALTER TABLE wishlists ADD INDEX idx_user_default (user_id, is_default);
ALTER TABLE wishlist_items ADD INDEX idx_wishlist_added (wishlist_id, added_at DESC);

ALTER TABLE news_comments ADD INDEX idx_news_approved_created (news_id, status, created_at DESC);
ALTER TABLE news_comment_likes ADD INDEX idx_comment_user (comment_id, user_id);

ALTER TABLE admin_activity_logs ADD INDEX idx_entity_created (entity_type, entity_id, created_at DESC);
ALTER TABLE admin_activity_logs ADD INDEX idx_action_created (action, created_at DESC);
