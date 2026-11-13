# OwenFX Supabase migration history

Project: `gjzxultalptqwqmpagzj`  
Database engine: PostgreSQL 17.11  
Snapshot date: 2026-11-11

This document reconciles the production migration ledger with the SQL files tracked in GitHub. The eight earlier historical SQL files listed below were recovered from the supplied `owenfx-Backup.zip` archive, whose SQL checksums match its manifest. They were reviewed against the live production schema and selectively reconciled: retired database objects and policies were not restored. Two additional migrations were restored to GitHub from the historical repository commit and are also present in the production migration ledger. These files are historical records, not instructions to replay migrations against production.

## 1. Production migration ledger

| Version | Migration name | GitHub SQL status |
|---|---|---|
| `20261105221034` | `secure_verification_codes` | Explanatory no-op: verification_codes was later retired |
| `20261105221115` | `content_platform` | Recovered and reconciled against current content-platform objects |
| `20261105221137` | `resource_monetization` | Recovered selectively; retired resource objects excluded |
| `20261105221150` | `software_catalog` | Recovered; active software catalogue and support objects retained |
| `20261105221158` | `software_analytics` | Recovered with retired resource_click removed |
| `20261106055944` | `add_bio_to_profiles` | Recovered; bio column exists in production |
| `20261106060102` | `allow_users_insert_own_profile` | Recovered; matching profile policy exists in production |
| `20261106061754` | `add_article_user_interactions` | Recovered; table and matching policies exist in production |
| `20261107040934` | `import_reference_mock_articles` | Intentional no-op historical placeholder; sample rows were subsequently removed |
| `20261107045725` | `article_github_content_and_api_devices` | Existing GitHub migration |
| `20261107050640` | `restrict_api_devices_to_owner_scope` | Existing GitHub migration |
| `20261107060000` | `r2_unified_media_assets` | Existing GitHub migration; version is recorded in production |
| `20261109164831` | `remove_legacy_verification_codes` | Existing GitHub migration |
| `20261110090913` | `remove_legacy_resource_click_policy` | Existing GitHub migration |
| `20261111081909` | `harden_software_publication_and_rls_access` | Restored from historical commit; matching version is recorded in production |
| `20261111081959` | `isolate_security_definer_membership_helpers` | Restored from historical commit; matching version is recorded in production |

At the snapshot date, all 16 migration versions and names in the production ledger have matching SQL files in the GitHub `supabase/migrations/` directory. No unmatched production migration or extra GitHub migration was found in this comparison.

## 2. Recovery and reconciliation

- The supplied archive contains eight earlier SQL files and a manifest. All eight SQL checksums match the manifest.
- Those recovered files were compared with the current production tables, columns, constraints, and RLS policies. Only objects that remain part of the current schema were retained.
- The two migrations dated 2026-11-11 were restored to GitHub from the historical repository commit. Their version identifiers and names match the corresponding entries in the production migration ledger.
- `20261105221034_secure_verification_codes.sql` intentionally contains comments only. The `verification_codes` table was removed by the later `remove_legacy_verification_codes` migration and is absent from production.
- `20261105221137_resource_monetization.sql` retains `site_promotions`, `site_settings`, and the original analytics-event foundation. It excludes `cloud_resources`, `cloud_resource_links`, `analytics_events.resource_id`, `resource_click`, and all associated indexes and policies because those objects were retired.
- `20261105221158_software_analytics.sql` retains `software_id` and the currently supported event types: `software_click`, `wechat_click`, `ad_click`, and `article_view`. It does not restore `resource_click`.
- The content-platform and software-catalog migrations describe earlier schema stages. Later migrations and reviewed production changes extended or adjusted those objects. The production schema snapshot remains the authoritative description of the current database.
- The migration-ledger comparison verifies version identifiers and names; it does not by itself prove that every historical SQL file is byte-for-byte identical to the SQL originally executed or that every live database object matches a migration file.

## 3. Production cleanup already applied

The independent legacy resource module was removed directly from production before this reconciliation and has no separate migration-ledger version. The verified final state excludes:

- `public.cloud_resources` and `public.cloud_resource_links`;
- `public.analytics_events.resource_id` and its foreign key;
- the retired `resource_click` event type and its public insert-policy allowance.

The analytics table and its other records were retained. The separate `software_download_links` table was retained. No production SQL was executed as part of this GitHub recovery.

## 4. Migration and restore safety

- The production migration ledger is authoritative for applied version identifiers; the current schema snapshot is authoritative for the live structure.
- The recovered historical SQL is curated for archival accuracy. It is not guaranteed to be a standalone bootstrap sequence and must not be replayed against production.
- The intentional no-op placeholders for `secure_verification_codes` and `import_reference_mock_articles` must not be treated as schema definitions.
- A matching migration-version list does not prove that a fresh database has the production schema.
- Do not run a full migration replay against a new project until a separately reviewed bootstrap procedure covers the baseline, Auth dependencies, event triggers, extensions, grants, RLS, and external services.
- Existing production must continue to be changed only through reviewed, forward-only SQL migrations. Do not replay historical files against production.

The production schema snapshot is stored in `supabase/schema/production-baseline.sql`; platform-specific dependencies are documented in `supabase/docs/PLATFORM_DEPENDENCIES.md`.
