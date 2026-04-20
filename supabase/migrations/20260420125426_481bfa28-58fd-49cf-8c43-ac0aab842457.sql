ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent1_name text,
  ADD COLUMN IF NOT EXISTS parent1_phone text,
  ADD COLUMN IF NOT EXISTS parent2_name text,
  ADD COLUMN IF NOT EXISTS parent2_phone text;

ALTER TABLE public.kids
  DROP COLUMN IF EXISTS parent1_name,
  DROP COLUMN IF EXISTS parent1_phone,
  DROP COLUMN IF EXISTS parent2_name,
  DROP COLUMN IF EXISTS parent2_phone;