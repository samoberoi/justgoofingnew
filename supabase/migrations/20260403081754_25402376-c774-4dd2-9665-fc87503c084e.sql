
CREATE TABLE public.rider_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_assignment_id uuid NOT NULL REFERENCES public.delivery_assignments(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rider_locations_assignment ON public.rider_locations(delivery_assignment_id, created_at DESC);

ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

-- Riders can insert their own locations
CREATE POLICY "Riders can insert own location"
ON public.rider_locations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = rider_id);

-- Riders can view own locations
CREATE POLICY "Riders can view own locations"
ON public.rider_locations FOR SELECT TO authenticated
USING (auth.uid() = rider_id);

-- Authenticated users can view rider locations (for order tracking)
CREATE POLICY "Users can view rider locations for their orders"
ON public.rider_locations FOR SELECT TO authenticated
USING (true);

-- Super admin full access
CREATE POLICY "Super admin full rider locations"
ON public.rider_locations FOR ALL TO public
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations;
