-- Add payment settlement workflow to user_packs
ALTER TABLE public.user_packs
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS settled_by uuid;

-- Backfill existing rows as paid (no impact on legacy data)
UPDATE public.user_packs SET payment_status = 'paid', paid_at = COALESCE(paid_at, purchased_at) WHERE payment_status IS NULL OR payment_status = 'paid';

-- Allow 'pending' status on packs (status text already, no enum change needed)
-- New convention: status='pending' + payment_status='pending' until admin settles
-- Free welcome packs auto-paid (handled in app code)

-- Allow customer to view their own packs (already covered by existing RLS — just verify)
-- Let store managers and super admins view & update packs to settle payments
DROP POLICY IF EXISTS "Store manager view all packs" ON public.user_packs;
DROP POLICY IF EXISTS "Store manager settle packs" ON public.user_packs;
DROP POLICY IF EXISTS "Super admin full packs access" ON public.user_packs;

CREATE POLICY "Store manager view all packs"
  ON public.user_packs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_manager'));

CREATE POLICY "Store manager settle packs"
  ON public.user_packs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_manager'));

CREATE POLICY "Super admin full packs access"
  ON public.user_packs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));