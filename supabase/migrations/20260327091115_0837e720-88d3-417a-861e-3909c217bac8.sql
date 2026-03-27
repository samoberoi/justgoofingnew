-- Fix: Allow customers to find active stores (needed for order placement)
CREATE POLICY "Public can view active stores" ON public.stores FOR SELECT TO anon, authenticated USING (is_active = true);

-- Add delivery settings table for configurable delivery fees
CREATE TABLE public.delivery_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  free_delivery_above numeric NOT NULL DEFAULT 500,
  base_delivery_fee numeric NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view delivery settings" ON public.delivery_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Super admin full delivery settings" ON public.delivery_settings FOR ALL TO public USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed default delivery settings
INSERT INTO public.delivery_settings (free_delivery_above, base_delivery_fee) VALUES (500, 30);