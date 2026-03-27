
-- ========== REWARDS (reusable reward objects) ==========
CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'points',
  value numeric NOT NULL DEFAULT 0,
  free_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full rewards access" ON public.rewards FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view active rewards" ON public.rewards FOR SELECT TO anon, authenticated USING (is_active = true);

-- ========== LOYALTY CAMPAIGNS ==========
CREATE TABLE public.loyalty_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'percentage',
  category text NOT NULL DEFAULT 'general',
  coupon_code text,
  auto_apply boolean NOT NULL DEFAULT false,
  discount_value numeric NOT NULL DEFAULT 0,
  free_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  min_order_value numeric DEFAULT 0,
  max_discount numeric,
  usage_limit integer,
  per_user_limit integer DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  target_audience text NOT NULL DEFAULT 'all',
  target_badge_id uuid,
  reward_id uuid REFERENCES public.rewards(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full campaign access" ON public.loyalty_campaigns FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view active campaigns" ON public.loyalty_campaigns FOR SELECT TO anon, authenticated USING (is_active = true);

-- ========== STREAK CAMPAIGNS ==========
CREATE TABLE public.streak_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'weekly',
  min_orders_per_week integer NOT NULL DEFAULT 1,
  duration_weeks integer NOT NULL DEFAULT 4,
  grace_period_hours integer DEFAULT 48,
  auto_reset boolean NOT NULL DEFAULT true,
  reward_id uuid REFERENCES public.rewards(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.streak_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full streak campaign access" ON public.streak_campaigns FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view active streak campaigns" ON public.streak_campaigns FOR SELECT TO anon, authenticated USING (is_active = true);

-- ========== USER STREAKS ==========
CREATE TABLE public.user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  streak_campaign_id uuid NOT NULL REFERENCES public.streak_campaigns(id) ON DELETE CASCADE,
  current_week integer NOT NULL DEFAULT 0,
  orders_this_week integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_order_at timestamptz,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  broken boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full user streaks access" ON public.user_streaks FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);

-- ========== BADGES ==========
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🏅',
  criteria_type text NOT NULL DEFAULT 'orders',
  criteria_value numeric NOT NULL DEFAULT 1,
  tier_level integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full badges access" ON public.badges FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view active badges" ON public.badges FOR SELECT TO anon, authenticated USING (is_active = true);

-- ========== USER BADGES ==========
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full user badges access" ON public.user_badges FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

-- ========== POINTS SETTINGS ==========
CREATE TABLE public.points_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  earning_enabled boolean NOT NULL DEFAULT true,
  earning_percent numeric NOT NULL DEFAULT 2.5,
  max_earn_per_order numeric,
  redemption_enabled boolean NOT NULL DEFAULT true,
  points_to_currency numeric NOT NULL DEFAULT 1,
  max_redemption_percent numeric NOT NULL DEFAULT 50,
  min_order_for_redemption numeric DEFAULT 200,
  expiry_days integer DEFAULT 90,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.points_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full points settings access" ON public.points_settings FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view points settings" ON public.points_settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.points_settings (earning_enabled, earning_percent, redemption_enabled, points_to_currency, max_redemption_percent, min_order_for_redemption, expiry_days)
VALUES (true, 2.5, true, 1, 50, 200, 90);

-- ========== POINTS TRANSACTIONS ==========
CREATE TABLE public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'earned',
  amount numeric NOT NULL,
  balance_after numeric NOT NULL DEFAULT 0,
  description text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full points tx access" ON public.points_transactions FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own points" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON public.points_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========== REFERRAL SETTINGS ==========
CREATE TABLE public.referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_points numeric NOT NULL DEFAULT 100,
  referee_points numeric NOT NULL DEFAULT 50,
  referee_discount_percent numeric DEFAULT 10,
  max_referrals_per_user integer,
  require_first_order boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full referral settings" ON public.referral_settings FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view referral settings" ON public.referral_settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.referral_settings (referrer_points, referee_points, referee_discount_percent, require_first_order)
VALUES (100, 50, 10, true);

-- ========== REFERRALS ==========
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referee_id uuid,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  referee_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points_awarded numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin full referrals access" ON public.referrals FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "Users can insert referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Seed default Sultanate badges
INSERT INTO public.badges (name, description, icon, criteria_type, criteria_value, tier_level) VALUES
  ('Naya Mehmaan', 'Welcome to the Sultanate! First order completed.', '🌟', 'orders', 1, 1),
  ('Biryani Explorer', 'Tried 3 different biryanis from the royal menu.', '🗺️', 'orders', 3, 2),
  ('Darbaar Regular', 'Placed 10 orders — a true court regular.', '👑', 'orders', 10, 3),
  ('Royal Patron', 'Spent over ₹5,000 in the Sultanate.', '💎', 'spend', 5000, 4),
  ('Sultan''s Favourite', 'Completed a 4-week streak — the Sultan honours you.', '🏆', 'streak', 4, 5);
