CREATE POLICY "Delivery partners can update own availability"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND role = 'delivery_partner')
WITH CHECK (auth.uid() = user_id AND role = 'delivery_partner');