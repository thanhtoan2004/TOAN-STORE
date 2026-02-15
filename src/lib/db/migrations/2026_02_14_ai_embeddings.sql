-- Create table for product embeddings
CREATE TABLE IF NOT EXISTS product_embeddings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    embedding JSON NOT NULL, -- Store as JSON array of floats
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (product_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEX for optimized search if using specific vector extensions in future
-- For now, we will use JSON functions or compute similarity in-memory/via query.
