-- Drop existing tables if they exist
DROP TABLE IF EXISTS elements;
DROP TABLE IF EXISTS floors;
DROP TABLE IF EXISTS centercodes;

-- Create centercodes table
CREATE TABLE centercodes (
    id SERIAL PRIMARY KEY,
    centercode TEXT NOT NULL UNIQUE,
    cpg_centerid NUMERIC
);

-- Create floors table
CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    floor TEXT NOT NULL
);

-- Create elements table
CREATE TABLE elements (
    id SERIAL PRIMARY KEY,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    w INTEGER NOT NULL,
    h INTEGER NOT NULL,
    element_type TEXT NOT NULL,
    element_name TEXT NOT NULL,
    centercode TEXT NOT NULL,
    floor TEXT NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX elements_centercode_floor_idx ON elements(centercode, floor);
CREATE INDEX centercodes_centercode_idx ON centercodes(centercode);
CREATE INDEX floors_floor_idx ON floors(floor);
