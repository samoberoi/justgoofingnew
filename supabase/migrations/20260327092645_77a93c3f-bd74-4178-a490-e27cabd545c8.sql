-- Fix infinite recursion: Drop the ALL policies that use 'public' role and recreate them scoped properly
-- The issue: ALL policies with 'public' role are evaluated for every user including customers,
-- and the has_role() + get_user_store() calls cause recursion during INSERT

-- Drop problematic policies
DROP POLICY IF EXISTS "Store manager manage own store orders" ON public.orders;
DROP POLICY IF EXISTS "Super admin full order access" ON public.orders;
DROP POLICY IF EXISTS "Kitchen can view own store orders" ON public.orders;
DROP POLICY IF EXISTS "Kitchen can update own store orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery can update assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;

-- Recreate with 'authenticated' role only (not 'public') to avoid recursion
-- Customers: insert and view
CREATE POLICY "Customers can insert orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Customers can view orders" ON public.orders
  FOR SELECT TO authenticated USING (true);

-- Super admin: full access via security definer function (no recursion)
CREATE POLICY "Super admin full order access" ON public.orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Store manager
CREATE POLICY "Store manager manage orders" ON public.orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'store_manager'::app_role) AND store_id = get_user_store(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'store_manager'::app_role) AND store_id = get_user_store(auth.uid()));

-- Kitchen
CREATE POLICY "Kitchen view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'kitchen_manager'::app_role) AND store_id = get_user_store(auth.uid()));

CREATE POLICY "Kitchen update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'kitchen_manager'::app_role) AND store_id = get_user_store(auth.uid()));

-- Delivery
CREATE POLICY "Delivery view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'delivery_partner'::app_role) AND EXISTS (
    SELECT 1 FROM delivery_assignments WHERE order_id = orders.id AND delivery_partner_id = auth.uid()
  ));

CREATE POLICY "Delivery update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'delivery_partner'::app_role) AND EXISTS (
    SELECT 1 FROM delivery_assignments WHERE order_id = orders.id AND delivery_partner_id = auth.uid()
  ));