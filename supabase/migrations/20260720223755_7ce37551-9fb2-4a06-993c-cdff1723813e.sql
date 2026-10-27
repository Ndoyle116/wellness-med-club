
-- Patient documents table
CREATE TYPE public.patient_document_type AS ENUM ('lab_result', 'id_license', 'other');

CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type public.patient_document_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_documents TO authenticated;
GRANT ALL ON public.patient_documents TO service_role;

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own documents"
  ON public.patient_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all documents"
  ON public.patient_documents FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER patient_documents_updated_at
  BEFORE UPDATE ON public.patient_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX patient_documents_user_idx ON public.patient_documents(user_id, created_at DESC);

-- Storage RLS: files stored under {user_id}/{doc_type}/{filename}
CREATE POLICY "Users can read own patient documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own patient documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own patient documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Staff can view all patient documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND public.is_staff(auth.uid())
  );
