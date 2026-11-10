# OwenFX Supabase migration history

Project: `gjzxultalptqwqmpagzj`  
Database engine: PostgreSQL 17.11  
Snapshot date: 2026-11-10

This document reconciles the production migration ledger with the SQL files currently tracked in GitHub. The migration ledger records versions and names; it does not contain the original SQL bodies. Eight unrecoverable historical versions now have explicitly labelled no-op files solely to align local and remote version identifiers.

## 1. Production migration ledger

| Version | Migration name | GitHub SQL status |
|---|---|---|
| `20261105221034` | `secure_verification_codes` | History-only no-op file added; original SQL remains unavailable |
| `20261105221115` | `content_platform` | History-only no-op file added; original SQL remains unavailable |
| `20261105221137` | `resource_monetization` | History-only no-op file added; original SQL remains unavailable |
| `20261105221150` | `software_catalog` | History-only no-op file added; original SQL remains unavailable |
| `20261105221158` | `software_analytics` | History-only no-op file added; original SQL remains unavailable |
| `20261106055944` | `add_bio_to_profiles` | History-only no-op file added; original SQL remains unavailable |
| `20261106060102` | `allow_users_insert_own_profile` | History-only no-op file added; original SQL remains unavailable |
| `20261106061754` | `add_article_user_interactions` | History-only no-op file added; original SQL remains unavailable |
| `20261107040934` | `import_reference_mock_articles` | File exists as a no-op historical placeholder; original SQL is unavailable and sample rows were subsequently removed |
| `20261107045725` | `article_github_content_and_api_devices` | File exists in GitHub |
| `20261107050640` | `restrict_api_devices_to_owner_scope` | File exists in GitHub |
| `20261109164831` | `remove_legacy_verification_codes` | File exists in GitHub |
| `20261110090913` | `remove_legacy_resource_click_policy` | SQL body recovered from the production change and added to GitHub in this update |

## 2. Repository/production mismatch

- GitHub contains `20261107060000_r2_unified_media_assets.sql`, but the production migration ledger has no matching version. Its effects are present in the production `media_assets` table and RLS policies. The repository SQL is retained; this document records the missing ledger entry. Do not blindly replay it against production.
- The eight historical entries above cannot be reconstructed from migration names alone. Their original SQL has not been fabricated. Their corresponding files contain comments only and are **history-only placeholders**: they do not create tables, columns, policies, functions, or data. They exist only so `supabase migration list --remote` can reconcile the repository's version identifiers with the production ledger.
- Never use these eight placeholders to bootstrap or restore a new project. They do not reproduce the schema changes from 2026-11-05 and 2026-11-06. The current production schema snapshot is stored separately in `supabase/schema/production-baseline.sql`, and the platform-specific dependencies are documented in `supabase/docs/PLATFORM_DEPENDENCIES.md`.
- The `20261107040934` placeholder intentionally does not reinsert sample article data.

## 3. Previously executed manual cleanup

The legacy independent resource module was removed directly from production before this reconciliation and has no corresponding migration version in the production ledger. The verified change removed:

- `public.cloud_resource_links` and `public.cloud_resources`;
- `public.analytics_events.resource_id` and its foreign key;
- the retired `resource_click` event type from the event constraint and public insert policy.

The `analytics_events` table and its other records were retained. The separate `software_download_links` table was retained. No synthetic timestamp or migration version has been invented for this already-applied change. Its final state is represented in the production baseline.

## 4. Reconciliation policy

The production ledger is authoritative for which version identifiers have been applied. GitHub SQL files are authoritative only where their original SQL is actually available and verified. Missing historical SQL is documented as missing; it must not be guessed, retroactively applied, or marked as a new migration.


## 5. Fresh-project and restore warning

- A matching migration version list does not prove that a fresh database has the production schema.
- The history-only placeholders are intentionally empty and must never be treated as executable schema history.
- Do not run a full migration replay against a new project until a separately reviewed bootstrap procedure exists for the baseline, Auth dependencies, event triggers, extensions, grants, RLS, and external services.
- Existing production must continue to be changed only through reviewed, forward-only SQL migrations. Do not replay historical files against production.
