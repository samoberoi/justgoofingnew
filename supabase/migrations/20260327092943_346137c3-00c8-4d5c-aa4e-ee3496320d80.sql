-- Fix: ALL policies cause recursion because they're evaluated for INSERT too
-- Replace ALL with specific SELECT/UPDATE/DELETE policies

DROP POLICY IF EXISTS "Super admin full order access" ON public.orders;
DROP POLICY IF EXISTS "Store manager manage orders" ON public.orders;

-- Super admin: separate policies per command
CREATE POLICY "Super admin select orders" ON public.orders
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin delete orders" ON public.orders
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Store manager: separate policies per command
CREATE POLICY "Store manager select orders" ON public.orders
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'store_manager'::app_role) AND store_id = get_user_store(auth.uid()));

CREATE POLICY "Store manager update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'store_manager'::app_role) AND store_id = get_user_store(auth.uid()));

CREATE POLICY "Store manager delete orders" ON public.orders
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'store_manager'::app_role) AND store_id = get_user_store(auth.uid()));