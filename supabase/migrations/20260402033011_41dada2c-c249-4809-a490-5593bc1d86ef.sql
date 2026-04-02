
-- Inventory Categories (Proteins, Grains, Spices, Dairy, Vegetables, Oils, Packaging, etc.)
CREATE TABLE public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full inventory categories" ON public.inventory_categories FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager view inventory categories" ON public.inventory_categories FOR SELECT USING (has_role(auth.uid(), 'store_manager'));
CREATE POLICY "Kitchen manager view inventory categories" ON public.inventory_categories FOR SELECT USING (has_role(auth.uid(), 'kitchen_manager'));

-- Inventory Items (raw materials)
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock_level NUMERIC NOT NULL DEFAULT 0,
  max_stock_level NUMERIC,
  cost_per_unit NUMERIC DEFAULT 0,
  supplier_name TEXT,
  supplier_phone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full inventory items" ON public.inventory_items FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager view inventory items" ON public.inventory_items FOR SELECT USING (has_role(auth.uid(), 'store_manager'));
CREATE POLICY "Kitchen manager view inventory items" ON public.inventory_items FOR SELECT USING (has_role(auth.uid(), 'kitchen_manager'));

-- Inventory Transactions (stock movements)
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'received',
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  reference_note TEXT,
  performed_by UUID,
  stock_after NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full inventory transactions" ON public.inventory_transactions FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager view inventory transactions" ON public.inventory_transactions FOR SELECT USING (has_role(auth.uid(), 'store_manager'));
CREATE POLICY "Kitchen manager view inventory transactions" ON public.inventory_transactions FOR SELECT USING (has_role(auth.uid(), 'kitchen_manager'));

-- Trigger to update updated_at on inventory_items
CREATE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default inventory categories
INSERT INTO public.inventory_categories (name, display_order) VALUES
  ('Proteins', 1),
  ('Grains & Rice', 2),
  ('Spices & Masalas', 3),
  ('Dairy', 4),
  ('Vegetables & Herbs', 5),
  ('Oils & Ghee', 6),
  ('Dry Fruits & Nuts', 7),
  ('Packaging', 8),
  ('Others', 9);
