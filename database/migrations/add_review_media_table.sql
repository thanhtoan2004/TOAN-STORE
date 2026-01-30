-- Migration: Add review_media table for storing review images and videos
-- Created: 2026-01-30

-- Create review_media table
CREATE TABLE IF NOT EXISTS review_media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id BIGINT UNSIGNED NOT NULL,
  media_type ENUM('image', 'video') NOT NULL,
  media_url VARCHAR(1000) NOT NULL,
  thumbnail_url VARCHAR(1000) DEFAULT NULL COMMENT 'Thumbnail for videos or optimized image',
  file_size INT DEFAULT NULL COMMENT 'File size in bytes',
  mime_type VARCHAR(100) DEFAULT NULL COMMENT 'MIME type of the file',
  position INT DEFAULT 0 COMMENT 'Display order',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_review_id (review_id),
  KEY idx_media_type (media_type),
  CONSTRAINT fk_review_media_review 
    FOREIGN KEY (review_id) 
    REFERENCES product_reviews(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Add comments
ALTER TABLE review_media COMMENT = 'Stores media (images and videos) attached to product reviews';
