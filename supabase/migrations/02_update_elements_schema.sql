-- First, drop any existing foreign key constraints and indices on the elements table for picking_floor
ALTER TABLE elements DROP CONSTRAINT IF EXISTS elements_picking_floor_fkey;
DROP INDEX IF EXISTS idx_elements_picking_floor;

-- Rename the current picking_floor column in elements table to picking_floor_id to keep the references temporarily
ALTER TABLE elements RENAME COLUMN picking_floor TO picking_floor_id;

-- Add a new picking_floor column of type TEXT
ALTER TABLE elements ADD COLUMN picking_floor TEXT;

-- Update the picking_floor column with the correct values from the floors table
UPDATE elements e 
SET picking_floor = f.picking_floor
FROM floors f
WHERE e.picking_floor_id = f.id;

-- Add NOT NULL constraint to the picking_floor column now that it has data
ALTER TABLE elements ALTER COLUMN picking_floor SET NOT NULL;

-- Drop the now-unnecessary picking_floor_id column
ALTER TABLE elements DROP COLUMN picking_floor_id;

-- Recreate the unique constraint between centercode and picking_floor
ALTER TABLE elements ADD CONSTRAINT unique_centercode_picking_floor_element_id UNIQUE (centercode, picking_floor, element_id);

-- Create index for faster queries
CREATE INDEX idx_elements_picking_floor ON elements(picking_floor);

-- Update the functions/triggers if any reference this column (none in this case)
