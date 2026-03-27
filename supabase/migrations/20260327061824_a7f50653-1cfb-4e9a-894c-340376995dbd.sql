-- Menu Categories table
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full category access" ON public.menu_categories FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager view categories" ON public.menu_categories FOR SELECT USING (public.has_role(auth.uid(), 'store_manager'));
CREATE POLICY "Kitchen view categories" ON public.menu_categories FOR SELECT USING (public.has_role(auth.uid(), 'kitchen_manager'));

-- Add new columns to menu_items
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS spice_level integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS base_price numeric,
  ADD COLUMN IF NOT EXISTS discounted_price numeric,
  ADD COLUMN IF NOT EXISTS prep_time integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_chefs_special boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS availability_schedule jsonb DEFAULT null;

-- Menu Variants table
CREATE TABLE public.menu_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL,
  prep_time_override integer,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full variant access" ON public.menu_variants FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager view variants" ON public.menu_variants FOR SELECT USING (public.has_role(auth.uid(), 'store_manager'));
CREATE POLICY "Kitchen view variants" ON public.menu_variants FOR SELECT USING (public.has_role(auth.uid(), 'kitchen_manager'));

-- Add-on Groups table
CREATE TABLE public.menu_addon_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_selections integer NOT NULL DEFAULT 0,
  max_selections integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_addon_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full addon group access" ON public.menu_addon_groups FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager view addon groups" ON public.menu_addon_groups FOR SELECT USING (public.has_role(auth.uid(), 'store_manager'));
CREATE POLICY "Kitchen view addon groups" ON public.menu_addon_groups FOR SELECT USING (public.has_role(auth.uid(), 'kitchen_manager'));

-- Add-ons table
CREATE TABLE public.menu_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.menu_addon_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full addon access" ON public.menu_addons FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager view addons" ON public.menu_addons FOR SELECT USING (public.has_role(auth.uid(), 'store_manager'));
CREATE POLICY "Kitchen view addons" ON public.menu_addons FOR SELECT USING (public.has_role(auth.uid(), 'kitchen_manager'));

-- Item-to-AddonGroup link table
CREATE TABLE public.menu_item_addon_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  addon_group_id uuid NOT NULL REFERENCES public.menu_addon_groups(id) ON DELETE CASCADE,
  UNIQUE(menu_item_id, addon_group_id)
);
ALTER TABLE public.menu_item_addon_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full item addon link access" ON public.menu_item_addon_groups FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager view item addon links" ON public.menu_item_addon_groups FOR SELECT USING (public.has_role(auth.uid(), 'store_manager'));

-- Store-level overrides for menu items
CREATE TABLE public.menu_store_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  price_override numeric,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(menu_item_id, store_id)
);
ALTER TABLE public.menu_store_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full override access" ON public.menu_store_overrides FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager manage own overrides" ON public.menu_store_overrides FOR ALL USING (has_role(auth.uid(), 'store_manager') AND store_id = get_user_store(auth.uid()));

-- Make menu-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Super admin upload menu images" ON storage.objects FOR ALL USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'super_admin')) WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone can view menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');

-- Enable realtime for menu items
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_categories;