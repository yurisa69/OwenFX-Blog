-- Remove only the two explicitly retired, unreferenced categories.
-- Both category rows were verified to have zero linked articles/software.
DELETE FROM public.categories
WHERE (kind = 'software' AND slug = 'devtools')
   OR (kind = 'article' AND slug = 'app-recommendations');
