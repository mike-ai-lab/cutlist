-- Add country field to licenses table for analytics
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS country VARCHAR(100);