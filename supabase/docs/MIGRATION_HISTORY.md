# OwenFX Supabase migration history

Project: `gjzxultalptqwqmpagzj`  
Database engine: PostgreSQL 17.11  
Snapshot date: 2026-11-17

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
| `20261113033924` | `comment_spam_moderation` | Applied to production; matching SQL file tracked in GitHub |
| `20261113033935` | `comment_spam_moderation_service_role_policies` | Applied to production; matching SQL file tracked in GitHub |
| `20261113051047` | `legacy_link_feedback_schema_stage` | Retired historical stage; superseded by the clean feedback schema |
| `20261113051500` | `legacy_link_feedback_access_stage` | Retired historical access stage; superseded by the clean feedback schema |
| `20261113054024` | `add_atomic_api_rate_limits` | Add private atomic API rate-limit storage, service-role-only RPC, and server-only analytics writes; applied to production |
| `20261113082045` | `article_sync_recovery_jobs` | Applied to production; SQL archive reconstructed from live schema and function metadata |
| `20261113083555` | `harden_article_sync_jobs` | Applied to production; SQL archive reconstructed from live lease and RPC definitions |
| `20261113092735` | `article_sync_article_locks` | Additive per-article sync lease table and service-role-only acquire/release RPCs |
| `20261113092747` | `release_failed_article_sync_leases` | Release task leases on failed/conflict/completed transitions to allow immediate safe retry |
| `20261113092936` | `article_sync_locks_service_role_policy` | Add an explicit service-role-only RLS policy for the private lock table |
| `20261114135410` | `remove_unused_categories` | Remove unused categories after checking references; applied to production |
| `20261115221034` | `article_trash_archive_states` | Add explicit archive restoration and soft-delete/recycle-bin states; applied to production |
| `20261115232549` | `software_trash_archive_states` | Add software archive restoration and recycle-bin state columns, extends the status constraint, and indexes status with update time; applied to production |

The production ledger now also contains the additive `20261115221034_article_trash_archive_states` migration. The 21 earlier versions have their previously reconciled SQL files in GitHub. The two initial article-sync migrations are reconstructed archival records based on verified production schema, constraints, and current RPC definitions; the three newer article-sync migrations are tracked with the SQL applied to production.

The two comment moderation migrations dated 2026-11-13 add the spam / deleted comment states, server-only Akismet context, and per-user rate limiting. They are forward-only changes; existing comment rows are retained.

The `20261113054024` migration adds `private.api_rate_limits` and a service-role-only atomic rate-limit RPC. It also removes direct `anon` / `authenticated` inserts into `analytics_events`; the application server now validates and records analytics events. Existing analytics rows are retained. The private rate-limit table is outside the public-schema baseline.

- `20261113082045_article_sync_recovery_jobs.sql` documents the `sync_job_id` columns and indexes, private durable job table, RLS, and service-role RPC contract.
- `20261113083555_harden_article_sync_jobs.sql` documents the lease columns, atomic claim function, idempotency payload checks, and lease-bound state transitions.
- These two files were reconstructed after direct production application and must not be replayed against the existing production database.

## 2. Recovery and reconciliation

- The supplied archive contains eight earlier SQL files and a manifest. All eight SQL checksums match the manifest.
- Those recovered files were compared with the current production tables, columns, constraints, and RLS policies. Only objects that remain part of the current schema were retained.
- The two migrations dated 2026-11-11 were restored to GitHub from the historical repository commit. Their version identifiers and names match the corresponding entries in the production migration ledger.
- `20261113082045_article_sync_recovery_jobs.sql` documents the additive `sync_job_id` columns and indexes, private durable job table, RLS, and initial service-role RPCs.
- `20261113083555_harden_article_sync_jobs.sql` documents the lease columns, atomic claim function, idempotency payload checks, and lease-bound state transitions. Both files were reconstructed after production application from verified live metadata; they are archival records and must not be replayed against the existing production database.
- `20261113092735_article_sync_article_locks.sql` adds a private per-article lease table and service-role-only RPCs. The lease serializes distinct sync jobs for the same article across GitHub and Supabase operations.
- `20261113092747_release_failed_article_sync_leases.sql` releases a task lease when a task enters `failed`, allowing the original idempotent request to reclaim and resume it immediately.
- `20261113092936_article_sync_locks_service_role_policy.sql` adds an explicit RLS policy limited to `service_role`; the private lock table remains inaccessible to `anon` and `authenticated`.
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

- `20261116005317` `restrict_software_download_providers`: limits software download links to UC, Quark, Baidu and Thunder; adds an admin-only atomic link replacement RPC. Existing download-link table retained.

The production schema snapshot is stored in `supabase/schema/production-baseline.sql`; platform-specific dependencies are documented in `supabase/docs/PLATFORM_DEPENDENCIES.md`.

- `20261115232549` `software_trash_archive_states`: adds software archive restoration and recycle-bin state columns, extends the status constraint, and indexes status with update time. Applied to production; existing software rows retained. Its GitHub filename uses the exact production ledger version.
- `20261115234616` `legacy_link_feedback_retirement_stage`: historical schema retirement stage; superseded by the clean feedback schema.
- `20261115235048` `legacy_link_feedback_restore_stage`: historical restore stage; superseded by the clean feedback schema.
- `20261115235449` `legacy_link_feedback_access_restore_stage`: historical access stage; superseded by the clean feedback schema.
- `20261116001355` `legacy_link_feedback_transition_stage`: historical transition stage; superseded by the clean feedback schema.
- `20261116002611` `create_clean_software_link_feedbacks`: drops the empty inherited table and creates a new feedback-only table with fresh constraints, indexes, grants, and admin-only RLS.

The hosted migration ledger retains the original historical identifiers for retired schema stages as immutable audit metadata. The repository contains neutralized historical placeholders; those records do not represent active application logic or database objects.

The machine-readable production migration-version snapshot is `supabase/migration-ledger.json`. The repository check verifies that every applied production version remains represented by exactly one local SQL filename and rejects duplicate or malformed timestamps. It intentionally permits additional local SQL files as pending migrations. After a reviewed migration is applied to production, update the snapshot from the live Supabase migration ledger in the same repository change. Never rename or delete an applied migration.
