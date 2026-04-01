
-- Recipes table: one recipe per menu item
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  base_servings TEXT NOT NULL DEFAULT '1',
  cooking_time_minutes INTEGER,
  water_quantity TEXT,
  instructions TEXT,
  video_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(menu_item_id)
);

-- Recipe ingredients
CREATE TABLE public.recipe_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'grams',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS for recipes
CREATE POLICY "Super admin full recipe access" ON public.recipes FOR ALL TO public
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Store manager view recipes" ON public.recipes FOR SELECT TO public
  USING (has_role(auth.uid(), 'store_manager'::app_role));

CREATE POLICY "Kitchen manager view recipes" ON public.recipes FOR SELECT TO public
  USING (has_role(auth.uid(), 'kitchen_manager'::app_role));

-- RLS for recipe_ingredients
CREATE POLICY "Super admin full recipe ingredients access" ON public.recipe_ingredients FOR ALL TO public
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Store manager view recipe ingredients" ON public.recipe_ingredients FOR SELECT TO public
  USING (has_role(auth.uid(), 'store_manager'::app_role));

CREATE POLICY "Kitchen manager view recipe ingredients" ON public.recipe_ingredients FOR SELECT TO public
  USING (has_role(auth.uid(), 'kitchen_manager'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
