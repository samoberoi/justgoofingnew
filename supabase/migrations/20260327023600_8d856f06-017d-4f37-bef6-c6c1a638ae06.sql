
-- Create enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'store_manager', 'kitchen_manager', 'delivery_partner');
CREATE TYPE public.order_status AS ENUM ('new', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled');

-- Stores table
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  opening_time TIME DEFAULT '09:00',
  closing_time TIME DEFAULT '23:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles per security rules)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_veg BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  status order_status NOT NULL DEFAULT 'new',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cod',
  payment_status TEXT DEFAULT 'pending',
  special_instructions TEXT,
  accepted_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  special_instructions TEXT
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Delivery assignments table
CREATE TABLE public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_partner_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'assigned',
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND is_active = true
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

-- Function to get user store
CREATE OR REPLACE FUNCTION public.get_user_store(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.user_roles
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'BRY-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- RLS POLICIES

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- User roles
CREATE POLICY "Super admin can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Stores
CREATE POLICY "Super admin full store access" ON public.stores FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager can view own store" ON public.stores FOR SELECT USING (id = public.get_user_store(auth.uid()));

-- Menu items
CREATE POLICY "Super admin full menu access" ON public.menu_items FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager manage own menu" ON public.menu_items FOR ALL USING (public.has_role(auth.uid(), 'store_manager') AND store_id = public.get_user_store(auth.uid()));
CREATE POLICY "Kitchen can view own store menu" ON public.menu_items FOR SELECT USING (store_id = public.get_user_store(auth.uid()));

-- Orders
CREATE POLICY "Super admin full order access" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager manage own store orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'store_manager') AND store_id = public.get_user_store(auth.uid()));
CREATE POLICY "Kitchen can view own store orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'kitchen_manager') AND store_id = public.get_user_store(auth.uid()));
CREATE POLICY "Kitchen can update own store orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'kitchen_manager') AND store_id = public.get_user_store(auth.uid()));
CREATE POLICY "Delivery can view assigned orders" ON public.orders FOR SELECT USING (
  public.has_role(auth.uid(), 'delivery_partner') AND
  EXISTS (SELECT 1 FROM public.delivery_assignments WHERE order_id = orders.id AND delivery_partner_id = auth.uid())
);
CREATE POLICY "Delivery can update assigned orders" ON public.orders FOR UPDATE USING (
  public.has_role(auth.uid(), 'delivery_partner') AND
  EXISTS (SELECT 1 FROM public.delivery_assignments WHERE order_id = orders.id AND delivery_partner_id = auth.uid())
);

-- Order items
CREATE POLICY "Super admin full order items access" ON public.order_items FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager order items" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND store_id = public.get_user_store(auth.uid()))
);
CREATE POLICY "Kitchen can view order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND store_id = public.get_user_store(auth.uid()))
);
CREATE POLICY "Delivery can view assigned order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.delivery_assignments da JOIN public.orders o ON o.id = da.order_id WHERE o.id = order_items.order_id AND da.delivery_partner_id = auth.uid())
);

-- Delivery assignments
CREATE POLICY "Super admin full delivery access" ON public.delivery_assignments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager manage deliveries" ON public.delivery_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = delivery_assignments.order_id AND store_id = public.get_user_store(auth.uid()))
);
CREATE POLICY "Delivery partner view own assignments" ON public.delivery_assignments FOR SELECT USING (delivery_partner_id = auth.uid());
CREATE POLICY "Delivery partner update own assignments" ON public.delivery_assignments FOR UPDATE USING (delivery_partner_id = auth.uid());

-- Coupons
CREATE POLICY "Super admin full coupon access" ON public.coupons FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Store manager view coupons" ON public.coupons FOR SELECT USING (public.has_role(auth.uid(), 'store_manager'));

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
