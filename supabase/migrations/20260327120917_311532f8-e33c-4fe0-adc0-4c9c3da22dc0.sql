-- Add user_id column to orders table to link orders to authenticated users
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add house_number column for address detail
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS house_number text;

-- Create addresses table for saved addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text DEFAULT 'Home',
  line1 text,
  formatted_address text NOT NULL,
  house_number text,
  lat numeric,
  lng numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses" ON public.addresses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON public.addresses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.addresses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.addresses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super admin view addresses" ON public.addresses
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));