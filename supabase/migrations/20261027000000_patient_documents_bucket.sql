-- Private storage bucket for patient ID documents and lab uploads.
-- The access policies for this bucket live in 20260720223755_*.sql.
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;
