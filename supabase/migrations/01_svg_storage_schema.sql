-- Create centercodes table
CREATE TABLE IF NOT EXISTS centercodes (
    id SERIAL PRIMARY KEY,
    centercode TEXT UNIQUE NOT NULL
);

-- Create floors table
CREATE TABLE IF NOT EXISTS floors (
    id SERIAL PRIMARY KEY,
    centercode INTEGER NOT NULL REFERENCES centercodes(id) ON DELETE CASCADE,
    picking_floor TEXT NOT NULL,
    UNIQUE(centercode, picking_floor)
);

-- Create elements table
CREATE TABLE IF NOT EXISTS elements (
    id SERIAL PRIMARY KEY,
    centercode INTEGER NOT NULL REFERENCES centercodes(id) ON DELETE CASCADE,
    picking_floor INTEGER NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    element_id TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    w REAL NOT NULL,
    h REAL NOT NULL,
    element_type TEXT NOT NULL,
    UNIQUE(centercode, picking_floor, element_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_elements_centercode ON elements(centercode);
CREATE INDEX IF NOT EXISTS idx_elements_picking_floor ON elements(picking_floor);
CREATE INDEX IF NOT EXISTS idx_floors_centercode ON floors(centercode);
