
-- Allow public (anonymous) read access to active menu data for customer app
CREATE POLICY "Public can view active menu items"
ON public.menu_items FOR SELECT
TO anon, authenticated
USING (is_active = true AND is_available = true);

CREATE POLICY "Public can view active categories"
ON public.menu_categories FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Public can view active addon groups"
ON public.menu_addon_groups FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Public can view active addons"
ON public.menu_addons FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Public can view item addon links"
ON public.menu_item_addon_groups FOR SELECT
TO anon, authenticated
USING (true);
