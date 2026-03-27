
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS delivery_radius numeric DEFAULT 5,
  ADD COLUMN IF NOT EXISTS default_prep_time integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS tax_percent numeric DEFAULT 5;
