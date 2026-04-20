
-- Update trigger to extract phone from mock-auth email prefix when auth.phone is null
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  derived_phone TEXT;
  email_local TEXT;
BEGIN
  email_local := split_part(COALESCE(NEW.email, ''), '@', 1);
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    derived_phone := NEW.phone;
  ELSIF email_local ~ '^\d{10,15}$' THEN
    derived_phone := email_local;
  ELSE
    derived_phone := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, phone)
  VALUES (NEW.id, derived_phone)
  ON CONFLICT (user_id) DO UPDATE
    SET phone = COALESCE(public.profiles.phone, EXCLUDED.phone);
  RETURN NEW;
END;
$function$;

-- Ensure user_id is unique on profiles (for ON CONFLICT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Backfill: create profiles for any auth user missing one, deriving phone from email prefix
INSERT INTO public.profiles (user_id, phone)
SELECT u.id,
  CASE
    WHEN u.phone IS NOT NULL AND u.phone <> '' THEN u.phone
    WHEN split_part(COALESCE(u.email, ''), '@', 1) ~ '^\d{10,15}$' THEN split_part(u.email, '@', 1)
    ELSE NULL
  END
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Backfill: fill missing phone numbers in existing profiles using email prefix
UPDATE public.profiles p
SET phone = split_part(u.email, '@', 1)
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.phone IS NULL OR p.phone = '')
  AND split_part(COALESCE(u.email, ''), '@', 1) ~ '^\d{10,15}$';
