-- Add photo_url column to kids
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS photo_url text;

-- Storage policies on profile-pictures bucket for kid photos
-- Folder convention: kids/{auth.uid()}/{filename}
CREATE POLICY "Parents can upload kid photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'kids'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Parents can update kid photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'kids'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Parents can delete kid photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'kids'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Public can view kid photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-pictures');