ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS aadhaar_number text,
  ADD COLUMN IF NOT EXISTS pan_document_url text,
  ADD COLUMN IF NOT EXISTS aadhaar_document_url text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS salary numeric;

INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Super admin full access to employee docs"
ON storage.objects FOR ALL
USING (bucket_id = 'employee-documents' AND public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (bucket_id = 'employee-documents' AND public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Users can view own employee docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-documents' AND (storage.foldername(name))[1] = auth.uid()::text);