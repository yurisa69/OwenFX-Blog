# OwenFX database change policy

## 1. Responsibility boundaries

- GitHub stores application source code, Markdown articles, database migration SQL, and database documentation.
- Supabase stores production user accounts, business data, and the live PostgreSQL schema.
- Cloudflare R2 stores media binaries; Supabase stores media metadata and ownership.
- Vercel builds and deploys the website only. A normal Vercel build/deployment must never apply SQL migrations or modify the production database.

## 2. Database baseline

- `schema/production-baseline.sql` is a structure-only snapshot of the production `public` schema.
- It contains no application rows or user data.
- It is not a complete Supabase platform backup: managed schemas, platform roles, Auth internals, secrets, and external service configuration are not included.
- Never execute the baseline against the current production database. It is for reference and controlled bootstrap/recovery planning only.
- The migration history reconciliation is maintained in `docs/MIGRATION_HISTORY.md`.

## 3. Adding a database change

1. Inspect the existing schema, related application code, constraints, indexes, triggers, grants, and RLS policies before editing.
2. Create a timestamped SQL migration in `supabase/migrations/` using the Supabase CLI migration generator.
3. Keep each migration focused on one logical change. Prefer safe, forward-only changes and preserve existing data.
4. Review the SQL manually. For destructive changes, document affected tables/columns, row counts, dependencies, rollback/recovery strategy, and obtain explicit approval before execution.
5. Validate the migration in a disposable local/test database when available. Never use production as a trial-and-error environment.
6. Apply the reviewed migration to production as a separate, deliberate database operation. Verify the resulting schema, migration ledger, RLS policies, and relevant application queries.
7. Update the baseline and migration history documentation when the production schema changes.
8. Only after database validation, update the application code and deploy it through the normal GitHub-to-Vercel workflow.

## 4. Production safety rules

- Do not run `supabase db reset`, destructive SQL, or database rebuilds against production.
- Do not run `supabase db push` as an unreviewed or automatic deployment step. Explicitly inspect pending migrations and target project before any production application.
- Never run migrations from Vercel build hooks, deployment hooks, or application startup.
- Never commit database passwords, Supabase access tokens, service-role keys, or connection strings.
- Do not export production user/business rows into GitHub. Schema-only artifacts are allowed after review.
- Do not use `CASCADE` or drop tables/columns without dependency and data-impact review plus explicit approval.
- Never rewrite migration files that have already been applied to production. Add a new forward migration to correct them.
- Do not invent historical SQL or migration version numbers. Record unrecoverable history gaps explicitly.
- Keep Supabase migration operations independent from website source commits where possible. A website-only change must not require a database operation.

## 5. Routine website deployment

For page, style, component, and application-code-only changes:

1. Modify and test the source code.
2. Review the complete change set.
3. Create one Git commit and one push to `main`.
4. Let Vercel deploy the website.
5. Do not touch the Supabase production schema unless the feature genuinely requires a database change.

## 6. Verification checklist

Before closing a database change, verify:

- The intended migration file exists and matches the reviewed SQL.
- The expected migration version appears in the production ledger.
- Tables, columns, constraints, indexes, functions, triggers, and policies match the intended result.
- RLS remains enabled on exposed `public` tables and policies enforce the intended ownership/role boundary.
- Relevant application queries still work.
- Supabase security/performance advisors have been reviewed where applicable.
- No production data was unintentionally deleted or exposed.

## 7. Current environment notes

- Production project: `gjzxultalptqwqmpagzj`.
- PostgreSQL major version: 17.
- Supabase CLI v3 is installed on the previously linked VPS, but the earlier schema dump attempt could not run because the CLI's dump path requires a Docker-compatible container runtime. Docker was intentionally not installed on the expiring VPS.
- The catalog-derived baseline in this repository is therefore explicitly marked as a structural reference, not represented as a full `supabase db dump`.
