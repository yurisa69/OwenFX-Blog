# OwenFX Supabase migration history

Project: `gjzxultalptqwqmpagzj`  
Database engine: PostgreSQL 17.11  
Snapshot date: 2026-11-10

This document reconciles the production migration ledger with the SQL files currently tracked in GitHub. The migration ledger records versions and names; it does not contain the original SQL bodies.

## 1. Production migration ledger

| Version | Migration name | GitHub SQL status |
|---|---|---|
| `20261105221034` | `secure_verification_codes` | Production-only ledger entry; original SQL not present in repository |
| `20261105221115` | `content_platform` | Production-only ledger entry; original SQL not present in repository |
| `20261105221137` | `resource_monetization` | Production-only ledger entry; original SQL not present in repository |
| `20261105221150` | `software_catalog` | Production-only ledger entry; original SQL not present in repository |
| `20261105221158` | `software_analytics` | Production-only ledger entry; original SQL not present in repository |
| `20261106055944` | `add_bio_to_profiles` | Production-only ledger entry; original SQL not present in repository |
| `20261106060102` | `allow_users_insert_own_profile` | Production-only ledger entry; original SQL not present in repository |
| `20261106061754` | `add_article_user_interactions` | Production-only ledger entry; original SQL not present in repository |
| `20261107040934` | `import_reference_mock_articles` | File exists as a no-op historical placeholder; original SQL is unavailable and sample rows were subsequently removed |
| `20261107045725` | `article_github_content_and_api_devices` | File exists in GitHub |
| `20261107050640` | `restrict_api_devices_to_owner_scope` | File exists in GitHub |
| `20261109164831` | `remove_legacy_verification_codes` | File exists in GitHub |
| `20261110090913` | `remove_legacy_resource_click_policy` | SQL body recovered from the production change and added to GitHub in this update |

## 2. Repository/production mismatch

- GitHub contains `20261107060000_r2_unified_media_assets.sql`, but the production migration ledger has no matching version. Its effects are present in the production `media_assets` table and RLS policies. The repository SQL is retained; this document records the missing ledger entry. Do not blindly replay it against production.
- The eight production-only entries above cannot be reconstructed from migration names alone. Their original SQL has not been fabricated. The current production schema snapshot is stored separately in `supabase/schema/production-baseline.sql`.
- The `20261107040934` placeholder intentionally does not reinsert sample article data.

## 3. Previously executed manual cleanup

The legacy independent resource module was removed directly from production before this reconciliation and has no corresponding migration version in the production ledger. The verified change removed:

- `public.cloud_resource_links` and `public.cloud_resources`;
- `public.analytics_events.resource_id` and its foreign key;
- the retired `resource_click` event type from the event constraint and public insert policy.

The `analytics_events` table and its other records were retained. The separate `software_download_links` table was retained. No synthetic timestamp or migration version has been invented for this already-applied change. Its final state is represented in the production baseline.

## 4. Reconciliation policy

The production ledger is authoritative for which version identifiers have been applied. GitHub SQL files are authoritative only where their original SQL is actually available and verified. Missing historical SQL is documented as missing; it must not be guessed, retroactively applied, or marked as a new migration.
