-- Bookings table for kids' play area slot reservations
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id),
  menu_item_id uuid REFERENCES public.menu_items(id),
  package_name text NOT NULL,
  package_price numeric NOT NULL DEFAULT 0,
  customer_name text,
  customer_phone text,
  kid_name text,
  kid_age integer,
  num_kids integer NOT NULL DEFAULT 1,
  booking_date date NOT NULL,
  slot_time time NOT NULL,
  duration_hours numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'booked',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'pay_at_venue',
  qr_code text NOT NULL,
  special_instructions text,
  total_amount numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  is_free_welcome boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  checked_in_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_store_date ON public.bookings(store_id, booking_date);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Generate booking number
CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := 'GOOF-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END IF;
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := encode(gen_random_bytes(8), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_generate_number
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.generate_booking_number();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status IN ('booked', 'pending'));

CREATE POLICY "Super admin full bookings access"
  ON public.bookings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Store manager view store bookings"
  ON public.bookings FOR SELECT
  USING (has_role(auth.uid(), 'store_manager'::app_role) AND store_id = get_user_store(auth.uid()));

CREATE POLICY "Store manager update store bookings"
  ON public.bookings FOR UPDATE
  USING (has_role(auth.uid(), 'store_manager'::app_role) AND store_id = get_user_store(auth.uid()));