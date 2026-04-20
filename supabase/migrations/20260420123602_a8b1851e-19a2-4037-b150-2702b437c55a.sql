-- Kids table
CREATE TABLE public.kids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  school TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kids_parent ON public.kids(parent_user_id);

ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own kids" ON public.kids
  FOR SELECT TO authenticated
  USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents insert own kids" ON public.kids
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Parents update own kids" ON public.kids
  FOR UPDATE TO authenticated
  USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents delete own kids" ON public.kids
  FOR DELETE TO authenticated
  USING (auth.uid() = parent_user_id);

CREATE POLICY "Super admin full kids access" ON public.kids
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Store manager view kids" ON public.kids
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'store_manager'));

CREATE TRIGGER update_kids_updated_at
  BEFORE UPDATE ON public.kids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Extend play_sessions
ALTER TABLE public.play_sessions
  ADD COLUMN kid_id UUID REFERENCES public.kids(id) ON DELETE SET NULL,
  ADD COLUMN plus_one BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_play_sessions_kid ON public.play_sessions(kid_id);