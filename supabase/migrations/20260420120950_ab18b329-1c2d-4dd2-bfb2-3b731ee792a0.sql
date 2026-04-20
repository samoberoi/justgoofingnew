-- Catalog of play packs (admin-managed)
CREATE TABLE public.play_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  pack_type text NOT NULL DEFAULT 'hour_pack', -- 'hour_pack' | 'single_visit' | 'welcome_free'
  total_hours numeric NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.play_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active play packs" ON public.play_packs
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Super admin full play packs access" ON public.play_packs
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_play_packs_updated_at
  BEFORE UPDATE ON public.play_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User-owned purchased packs (balance ledger)
CREATE TABLE public.user_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pack_id uuid REFERENCES public.play_packs(id) ON DELETE SET NULL,
  pack_name text NOT NULL,
  total_hours numeric NOT NULL DEFAULT 0,
  hours_used numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active', -- 'active' | 'exhausted'
  is_free_welcome boolean NOT NULL DEFAULT false,
  store_id uuid,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_packs_user_id ON public.user_packs(user_id);
CREATE INDEX idx_user_packs_status ON public.user_packs(status);

ALTER TABLE public.user_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own packs" ON public.user_packs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own packs" ON public.user_packs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Store manager view store packs" ON public.user_packs
  FOR SELECT USING (has_role(auth.uid(), 'store_manager'::app_role));

CREATE POLICY "Store manager update store packs" ON public.user_packs
  FOR UPDATE USING (has_role(auth.uid(), 'store_manager'::app_role));

CREATE POLICY "Super admin full user packs access" ON public.user_packs
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_user_packs_updated_at
  BEFORE UPDATE ON public.user_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Play sessions (each check-in/out cycle)
CREATE TABLE public.play_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_pack_id uuid REFERENCES public.user_packs(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  store_id uuid,
  kid_name text,
  num_kids integer NOT NULL DEFAULT 1,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_out_at timestamptz,
  hours_consumed numeric NOT NULL DEFAULT 0,
  extended_hours numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'cancelled'
  staff_user_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_play_sessions_user_id ON public.play_sessions(user_id);
CREATE INDEX idx_play_sessions_status ON public.play_sessions(status);
CREATE INDEX idx_play_sessions_user_pack_id ON public.play_sessions(user_pack_id);

ALTER TABLE public.play_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.play_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Store manager view store sessions" ON public.play_sessions
  FOR SELECT USING (has_role(auth.uid(), 'store_manager'::app_role));

CREATE POLICY "Store manager insert sessions" ON public.play_sessions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'store_manager'::app_role));

CREATE POLICY "Store manager update sessions" ON public.play_sessions
  FOR UPDATE USING (has_role(auth.uid(), 'store_manager'::app_role));

CREATE POLICY "Super admin full play sessions access" ON public.play_sessions
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_play_sessions_updated_at
  BEFORE UPDATE ON public.play_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default packs
INSERT INTO public.play_packs (name, description, pack_type, total_hours, price, display_order) VALUES
  ('Welcome 1 Hour FREE', 'Your first hour on us — try Just Goofing!', 'welcome_free', 1, 0, 1),
  ('10 Hour Play Pack', 'Save big — 10 hours to use anytime, no expiry', 'hour_pack', 10, 1499, 2),
  ('25 Hour Play Pack', 'Best value — 25 hours of unlimited fun', 'hour_pack', 25, 3299, 3),
  ('50 Hour Play Pack', 'Ultimate pack for regular goofers', 'hour_pack', 50, 5999, 4);