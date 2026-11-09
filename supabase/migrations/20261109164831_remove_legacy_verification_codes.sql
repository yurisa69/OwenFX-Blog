-- Remove the retired custom email OTP storage. Supabase Auth now owns signup email confirmation.
DROP TABLE IF EXISTS public.verification_codes;
