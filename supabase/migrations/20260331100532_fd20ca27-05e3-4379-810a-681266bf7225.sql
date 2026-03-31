
-- Backfill profile phone from auth email pattern ({phone}@ops.biryaan.app)
UPDATE profiles p
SET phone = split_part(u.email, '@', 1)
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.phone IS NULL OR p.phone = '')
  AND u.email LIKE '%@ops.biryaan.app';

-- Then backfill orders from updated profiles
UPDATE orders o
SET customer_phone = p.phone
FROM profiles p
WHERE o.user_id = p.user_id
  AND (o.customer_phone IS NULL OR o.customer_phone = '')
  AND p.phone IS NOT NULL AND p.phone != '';
