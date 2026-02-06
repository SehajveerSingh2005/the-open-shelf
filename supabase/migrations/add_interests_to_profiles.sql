-- Add interests column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN profiles.interests IS 'Array of interest IDs selected by the user';
