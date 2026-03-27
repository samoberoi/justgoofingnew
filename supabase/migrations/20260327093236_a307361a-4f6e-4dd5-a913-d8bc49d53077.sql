-- Fix recursion on ALL tables that the checkout flow touches
-- The pattern: ALL policies with 'public' role cause has_role() to be evaluated during INSERT

-- ORDER_ITEMS: Fix recursion
DROP POLICY IF EXISTS "Super admin full order items access" ON public.order_items;
DROP POLICY IF EXISTS "Store manager order items" ON public.order_items;

CREATE POLICY "Super admin select order items" ON public.order_items
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin update order items" ON public.order_items
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin delete order items" ON public.order_items
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Store manager select order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.store_id = get_user_store(auth.uid())));
CREATE POLICY "Store manager update order items" ON public.order_items
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.store_id = get_user_store(auth.uid())));

-- POINTS_TRANSACTIONS: Fix recursion
DROP POLICY IF EXISTS "Super admin full points tx access" ON public.points_transactions;

CREATE POLICY "Super admin select points tx" ON public.points_transactions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin update points tx" ON public.points_transactions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin delete points tx" ON public.points_transactions
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- STORES: Fix the ALL policy  
DROP POLICY IF EXISTS "Super admin full store access" ON public.stores;

CREATE POLICY "Super admin select stores" ON public.stores
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin insert stores" ON public.stores
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin update stores" ON public.stores
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin delete stores" ON public.stores
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));