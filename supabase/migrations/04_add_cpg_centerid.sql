-- Add cpg_centerid column to centercodes table
ALTER TABLE centercodes ADD COLUMN IF NOT EXISTS cpg_centerid TEXT;

-- Ensure tables have the correct structure according to requirements
-- No changes needed for floors table as it already has centercode TEXT and picking_floor TEXT columns

-- Make sure elements table has all required columns with correct types
ALTER TABLE elements 
    ALTER COLUMN x TYPE REAL,
    ALTER COLUMN y TYPE REAL,
    ALTER COLUMN w TYPE REAL,
    ALTER COLUMN h TYPE REAL;

-- Create indices for faster queries if they don't exist
CREATE INDEX IF NOT EXISTS idx_elements_centercode_picking_floor ON elements(centercode, picking_floor);
CREATE INDEX IF NOT EXISTS idx_floors_centercode_picking_floor ON floors(centercode, picking_floor);

-- Validate unique constraints
ALTER TABLE centercodes DROP CONSTRAINT IF EXISTS centercodes_centercode_key;
ALTER TABLE centercodes ADD CONSTRAINT centercodes_centercode_key UNIQUE (centercode);

ALTER TABLE floors DROP CONSTRAINT IF EXISTS unique_centercode_picking_floor;
ALTER TABLE floors ADD CONSTRAINT unique_centercode_picking_floor UNIQUE (centercode, picking_floor);

ALTER TABLE elements DROP CONSTRAINT IF EXISTS unique_centercode_picking_floor_element_id;
ALTER TABLE elements ADD CONSTRAINT unique_centercode_picking_floor_element_id UNIQUE (centercode, picking_floor, element_id);
