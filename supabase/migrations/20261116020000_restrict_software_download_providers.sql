-- Restrict software download links to the four supported providers.
-- A read-only production check on 2026-11-16 found no existing download-link rows.
BEGIN;
DELETE FROM public.software_download_links WHERE provider NOT IN ('uc', 'quark', 'baidu', 'thunder');
ALTER TABLE public.software_download_links DROP CONSTRAINT IF EXISTS software_download_links_provider_check;
ALTER TABLE public.software_download_links ADD CONSTRAINT software_download_links_provider_check
  CHECK (provider IN ('uc', 'quark', 'baidu', 'thunder'));

CREATE OR REPLACE FUNCTION public.replace_software_download_links(p_software_id uuid, p_links jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $function$
BEGIN
  IF NOT public.is_owenfx_admin() THEN RAISE EXCEPTION 'Administrator permission required'; END IF;
  IF jsonb_typeof(p_links) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Links must be a JSON array'; END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_links) AS item
    WHERE item->>'provider' NOT IN ('uc', 'quark', 'baidu', 'thunder')
       OR COALESCE(item->>'share_url', '') !~* '^https://'
  ) THEN RAISE EXCEPTION 'Unsupported provider or invalid HTTPS share URL'; END IF;
  DELETE FROM public.software_download_links WHERE software_id = p_software_id;
  INSERT INTO public.software_download_links (software_id, provider, label, share_url, access_code, sort_order, active)
  SELECT p_software_id, item->>'provider', LEFT(COALESCE(NULLIF(item->>'label', ''), '网盘下载'), 80),
    item->>'share_url', NULLIF(LEFT(COALESCE(item->>'access_code', ''), 32), ''),
    (ordinality - 1)::integer, true
  FROM jsonb_array_elements(p_links) WITH ORDINALITY AS links(item, ordinality);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.replace_software_download_links(uuid, jsonb) TO authenticated;
COMMIT;
