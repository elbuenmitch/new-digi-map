-- Drop existing foreign key constraints and indices for both centercode and picking_floor
ALTER TABLE elements DROP CONSTRAINT IF EXISTS elements_picking_floor_fkey;
ALTER TABLE elements DROP CONSTRAINT IF EXISTS elements_centercode_fkey;
DROP INDEX IF EXISTS idx_elements_picking_floor;
DROP INDEX IF EXISTS idx_elements_centercode;

-- Rename columns to keep the references temporarily
ALTER TABLE elements RENAME COLUMN picking_floor TO picking_floor_id;
ALTER TABLE elements RENAME COLUMN centercode TO centercode_id;

-- Add new columns of type TEXT
ALTER TABLE elements ADD COLUMN picking_floor TEXT;
ALTER TABLE elements ADD COLUMN centercode TEXT;

-- Update the new columns with the correct values from their respective tables
UPDATE elements e 
SET picking_floor = f.picking_floor
FROM floors f
WHERE e.picking_floor_id = f.id;

UPDATE elements e
SET centercode = c.centercode
FROM centercodes c
WHERE e.centercode_id = c.id;

-- Add NOT NULL constraints to the new columns now that they have data
ALTER TABLE elements ALTER COLUMN picking_floor SET NOT NULL;
ALTER TABLE elements ALTER COLUMN centercode SET NOT NULL;

-- Drop the now-unnecessary ID columns
ALTER TABLE elements DROP COLUMN picking_floor_id;
ALTER TABLE elements DROP COLUMN centercode_id;

-- Recreate the unique constraint
ALTER TABLE elements ADD CONSTRAINT unique_centercode_picking_floor_element_id UNIQUE (centercode, picking_floor, element_id);

-- Create indices for faster queries
CREATE INDEX idx_elements_picking_floor ON elements(picking_floor);
CREATE INDEX idx_elements_centercode ON elements(centercode);
