
UPDATE orders o
SET customer_phone = p.phone
FROM profiles p
WHERE o.user_id = p.user_id
  AND (o.customer_phone IS NULL OR o.customer_phone = '')
  AND p.phone IS NOT NULL AND p.phone != '';
