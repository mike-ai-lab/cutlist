-- Add campaign_tag column to licenses table for tracking gift campaigns and bulk operations
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS campaign_tag TEXT;

-- Add activated_at column to track when licenses are first used
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP;

-- Create index for faster campaign queries
CREATE INDEX IF NOT EXISTS idx_licenses_campaign_tag ON licenses(campaign_tag);

-- Create index for better analytics performance
CREATE INDEX IF NOT EXISTS idx_licenses_status_trial ON licenses(status, is_trial);

-- Create index for activation tracking
CREATE INDEX IF NOT EXISTS idx_licenses_device_hash ON licenses(device_hash);
CREATE INDEX IF NOT EXISTS idx_licenses_activated_at ON licenses(activated_at);

-- Update existing activated licenses to have activation timestamp
UPDATE licenses 
SET activated_at = issued_at 
WHERE activated_at IS NULL 
AND device_hash IS NOT NULL;

-- Update existing gift licenses (if any) to have proper campaign tags
UPDATE licenses 
SET campaign_tag = 'legacy-gift' 
WHERE campaign_tag IS NULL 
AND (user_name LIKE '%gift%' OR user_name LIKE '%Gift%');

-- Add comments for documentation
COMMENT ON COLUMN licenses.campaign_tag IS 'Tracks marketing campaigns, gifts, and bulk operations. Format: type-template-campaign (e.g., gift-youtuber-promo2024)';
COMMENT ON COLUMN licenses.activated_at IS 'Timestamp when the license was first activated/used on a device';