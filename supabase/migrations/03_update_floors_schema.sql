-- Drop existing foreign key constraints and indices for centercode in floors table
ALTER TABLE floors DROP CONSTRAINT IF EXISTS floors_centercode_fkey;
DROP INDEX IF EXISTS idx_floors_centercode;

-- Rename the current centercode column in floors table to centercode_id to keep the references temporarily
ALTER TABLE floors RENAME COLUMN centercode TO centercode_id;

-- Add a new centercode column of type TEXT
ALTER TABLE floors ADD COLUMN centercode TEXT;

-- Update the centercode column with the correct values from the centercodes table
UPDATE floors f 
SET centercode = c.centercode
FROM centercodes c
WHERE f.centercode_id = c.id;

-- Add NOT NULL constraint to the centercode column now that it has data
ALTER TABLE floors ALTER COLUMN centercode SET NOT NULL;

-- Drop the now-unnecessary centercode_id column
ALTER TABLE floors DROP COLUMN centercode_id;

-- Recreate the unique constraint for centercode and picking_floor
ALTER TABLE floors ADD CONSTRAINT unique_centercode_picking_floor UNIQUE (centercode, picking_floor);

-- Create index for faster queries
CREATE INDEX idx_floors_centercode ON floors(centercode);
