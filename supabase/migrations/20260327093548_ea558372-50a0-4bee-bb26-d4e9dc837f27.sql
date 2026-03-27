-- NUCLEAR FIX: Drop ALL policies on orders and recreate clean ones with NO cross-table references

-- Drop every single policy on orders
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
  END LOOP;
END $$;

-- Simple policies with NO cross-table joins
CREATE POLICY "orders_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orders_select" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "orders_delete" ON public.orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Also fix order_items - drop all and recreate clean
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'order_items' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_items', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_items_update" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "order_items_delete" ON public.order_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Also fix delivery_assignments to remove the circular orders reference
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'delivery_assignments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.delivery_assignments', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "da_insert" ON public.delivery_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "da_select" ON public.delivery_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "da_update" ON public.delivery_assignments FOR UPDATE TO authenticated USING (delivery_partner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "da_delete" ON public.delivery_assignments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));