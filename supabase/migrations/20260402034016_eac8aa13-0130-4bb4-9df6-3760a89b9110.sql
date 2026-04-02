CREATE POLICY "Authenticated can lookup pending referral codes"
ON public.referrals
FOR SELECT
TO authenticated
USING (status = 'pending' AND referee_id IS NULL);

CREATE POLICY "Authenticated can update referral to link referee"
ON public.referrals
FOR UPDATE
TO authenticated
USING (status = 'pending' AND referee_id IS NULL)
WITH CHECK (true);