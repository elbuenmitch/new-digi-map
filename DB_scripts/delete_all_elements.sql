-- SQL Script to delete all records from the elements table
-- Can be executed in the Supabase SQL Editor

-- Print the count before deletion (for verification)
SELECT COUNT(*) FROM elements;

-- Delete all records from the elements table
DELETE FROM elements;

-- Print the count after deletion (to confirm)
SELECT COUNT(*) FROM elements;
