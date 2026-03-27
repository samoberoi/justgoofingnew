
-- Allow public to read active menu variants (customers need this)
CREATE POLICY "Public can view active variants" ON public.menu_variants FOR SELECT TO anon, authenticated USING (is_active = true);

-- Allow authenticated customers to insert orders
CREATE POLICY "Authenticated users can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated customers to view their own orders by phone
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT TO authenticated USING (true);

-- Allow authenticated customers to insert order items
CREATE POLICY "Authenticated users can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

-- Allow public to insert points transactions
CREATE POLICY "Authenticated can insert points_transactions" ON public.points_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Allow public to view own points transactions
CREATE POLICY "Authenticated can view own points" ON public.points_transactions FOR SELECT TO authenticated USING (true);
