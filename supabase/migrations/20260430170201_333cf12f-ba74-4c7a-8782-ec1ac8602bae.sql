
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS biometric_enabled boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles (phone);

CREATE OR REPLACE FUNCTION public.phone_has_pin(_phone text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone = _phone AND pin_hash IS NOT NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.verify_phone_pin(_phone text, _pin_hash text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone = _phone AND pin_hash = _pin_hash
  )
$$;

CREATE OR REPLACE FUNCTION public.get_email_for_phone(_phone text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE phone = _phone LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.phone_has_pin(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_pin(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_for_phone(text) TO anon, authenticated;
