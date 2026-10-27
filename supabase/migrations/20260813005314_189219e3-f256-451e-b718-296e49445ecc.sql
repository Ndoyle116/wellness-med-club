
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_staff(text, text, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.patient_label(uuid) FROM anon, authenticated, public;
