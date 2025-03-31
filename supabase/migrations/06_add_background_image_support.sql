-- Migration: Add support for background images
-- This migration adds the necessary table and storage bucket for floor plan background images

-- Create the background_image_metadata table
CREATE TABLE IF NOT EXISTS background_image_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centercode TEXT NOT NULL,
    floor TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    opacity FLOAT DEFAULT 1.0,
    show_image BOOLEAN DEFAULT TRUE,
    original_width INTEGER DEFAULT 0,
    original_height INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add a unique constraint to ensure only one background image per centercode/floor combination
ALTER TABLE background_image_metadata 
    ADD CONSTRAINT unique_centercode_floor 
    UNIQUE (centercode, floor);

-- Create indexes for faster lookups
CREATE INDEX background_image_metadata_centercode_floor_idx 
    ON background_image_metadata(centercode, floor);

-- Create storage bucket for background images if it doesn't exist
-- Note: This requires the pgvector extension and the storage.buckets table to be set up
DO $$
BEGIN
    -- Check if storage schema and buckets table exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' 
        AND table_name = 'buckets'
    ) THEN
        -- Check if bucket already exists
        IF NOT EXISTS (
            SELECT 1 FROM storage.buckets 
            WHERE name = 'floor-plan-images'
        ) THEN
            -- Insert the new bucket
            INSERT INTO storage.buckets 
                (id, name, public, avif_autodetection)
            VALUES 
                ('floor-plan-images', 'floor-plan-images', true, false);
        END IF;
    END IF;
END $$;

-- Add RLS (Row Level Security) policy to allow anyone to select from this table
ALTER TABLE background_image_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view background images"
  ON background_image_metadata
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can insert background images"
  ON background_image_metadata
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update background images"
  ON background_image_metadata
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can delete background images"
  ON background_image_metadata
  FOR DELETE
  USING (TRUE);

-- Add trigger to update the updated_at timestamp whenever a row is updated
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_background_image_metadata_updated_at
BEFORE UPDATE ON background_image_metadata
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
