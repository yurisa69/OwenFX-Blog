ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
NOTIFY pgrst, 'reload schema';
