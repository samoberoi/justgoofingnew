ALTER TABLE public.kids
  ADD COLUMN IF NOT EXISTS parent1_name text,
  ADD COLUMN IF NOT EXISTS parent1_phone text,
  ADD COLUMN IF NOT EXISTS parent2_name text,
  ADD COLUMN IF NOT EXISTS parent2_phone text;