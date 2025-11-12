-- PARAMETRIX License Management Database Schema
-- Execute this in your Supabase SQL editor

-- Create licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_key VARCHAR(20) NOT NULL UNIQUE,
    user_name VARCHAR(255) NOT NULL,
    device_hash VARCHAR(64) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_trial BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked'))
);

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON public.licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_device_hash ON public.licenses(device_hash);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Create policy for service key access (adjust as needed)
CREATE POLICY "Service key access" ON public.licenses
    FOR ALL USING (true);

-- Grant permissions to authenticated users
GRANT ALL ON public.licenses TO authenticated;
GRANT ALL ON public.licenses TO service_role;