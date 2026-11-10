# OwenFX Supabase backup and recovery

Last reviewed: 2026-11-10  
Production project: `gjzxultalptqwqmpagzj`  
Database: PostgreSQL 17.11  
Current Supabase organization plan: **Free**

## 1. Executive status

The current production project does **not** have Supabase's scheduled daily physical database backups because its organization is on the Free plan. Supabase documents scheduled daily backups for Pro, Team, and Enterprise plans.

The repository file `schema/production-baseline.sql` is only a catalog-derived snapshot of the `public` schema. It contains no application rows and does not capture the full Supabase-managed database or project configuration.

The official Supabase CLI command `supabase db dump` is a supported logical export, but it deliberately excludes Supabase-managed schemas including `auth`, `storage`, and schemas created by extensions. It also does not include data or custom roles unless the corresponding flags are specified. Therefore, the CLI dump is useful for application-schema recovery, but it is **not a full Supabase platform backup**.

There is no supported, no-cost, single-file operation currently available to this Free-plan project that guarantees a complete, one-click restoration of the entire managed Supabase project. Do not claim otherwise.

Official references:

- [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase CLI db dump](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Supabase Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase Restore to a New Project](https://supabase.com/docs/guides/platform/clone-project)

## 2. Recommended strategy for the current Free plan

Use a layered, encrypted, off-site backup. Keep every backup artifact outside GitHub.

| Layer | What to preserve | Current limitation |
| --- | --- | --- |
| Application database | Roles, application schema, indexes, functions, RLS policies, and application rows through the official CLI logical dump | Excludes managed `auth` / `storage` schemas and extension-managed schemas |
| Auth recovery | Auth configuration checklist and a separately protected user inventory when required | Admin API user exports do not contain password hashes or active sessions; users may need to reset passwords |
| Project-specific database behavior | Custom Auth trigger/function definition, extension inventory, and event-trigger inventory | Supabase-managed global event triggers are platform-owned; do not try to recreate them as ordinary application triggers |
| Media | Cloudflare R2 objects and the object-key / metadata relationship | R2 objects are outside PostgreSQL backups and require a separate R2 backup |
| Platform configuration | Auth providers, email templates, SMTP, redirect URLs, secrets, Edge Functions, Realtime and other dashboard settings | These settings are not all contained in a database dump and must be recorded/reconfigured separately |

### 2.1 Run the official logical export on a workstation

The Supabase CLI dump path requires Docker. Do not install Docker on the production VPS just for this task. Run the official CLI workflow on a trusted workstation with Docker Desktop instead, or another isolated machine where Docker is already available.

Use the database connection string from Supabase Dashboard → Connect. Keep it in a local environment variable or a secret manager; do not paste it into shell scripts, source files, chat, or GitHub.

Example commands (run from a secure local backup directory):

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$SUPABASE_DB_URL" -f schema.sql
supabase db dump --db-url "$SUPABASE_DB_URL" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

The three files are logical exports, not physical snapshots. Protect them as production data. In particular, `data.sql` may contain personal and business records.

### 2.2 Preserve project-specific Auth behavior

The production database was inspected on 2026-11-10 and contains this custom Auth trigger:

```sql
CREATE TRIGGER on_auth_user_created_owenfx
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_owenfx_user();
```

Its function is:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_owenfx_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles(id,display_name)
  VALUES(
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name',''),split_part(NEW.email,'@',1))
  )
  ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END;
$function$;
```

The public function can be part of the application-schema dump; the trigger attached to `auth.users` is in the excluded managed `auth` schema and must not be assumed to be present in a CLI dump. During recovery to a new managed project, inspect the target first and recreate this custom trigger only if it is absent and the function is present and verified. Never run this DDL against the existing production project as part of a backup operation.

Auth user records, password hashes, identities, sessions, and provider configuration are not interchangeable. A user inventory exported through the Auth Admin API is useful for reconciliation but does not preserve password hashes or sessions. Do not claim that an Admin API user list is a restorable Auth backup.

## 3. Verified production dependency inventory

The following read-only catalog inspection was performed against production on 2026-11-10.

### 3.1 Installed PostgreSQL extensions

| Extension | Version |
| --- | --- |
| `pg_stat_statements` | `1.11` |
| `pgcrypto` | `1.3` |
| `plpgsql` | `1.0` |
| `supabase_vault` | `0.3.1` |
| `uuid-ossp` | `1.1` |

Extension availability and installation state must be checked on the recovery project. A logical dump that excludes extension-managed schemas is not a substitute for recording this inventory.

### 3.2 Global event triggers

The production database reported these enabled event triggers:

- `ensure_rls`
- `issue_graphql_placeholder`
- `issue_pg_cron_access`
- `issue_pg_graphql_access`
- `issue_pg_net_access`
- `pgrst_ddl_watch`
- `pgrst_drop_watch`

These are Supabase/platform-managed event triggers. Their presence is an inventory check, not a portable SQL backup. After recovery into a new Supabase-managed project, verify that the platform has provisioned its expected event triggers; do not manually recreate platform-owned triggers from guessed SQL.

### 3.3 Storage and media

OwenFX stores uploaded media binaries in Cloudflare R2. The PostgreSQL `media_assets` table stores metadata and object references; it does not contain the R2 file bytes. Back up the R2 bucket separately and preserve the mapping between object keys and media metadata. Supabase database backups do not back up external R2 objects.

## 4. Restore procedure and verification

A restore must target a new, isolated recovery project or a deliberately prepared test environment. Never test a restore against the live production project.

1. Provision a compatible PostgreSQL 17 Supabase project and record its new project reference.
2. Review the exported role and schema files before applying them. Supabase-managed roles and default grants may differ in the target project; do not blindly overwrite managed roles.
3. Restore the application schema and data using the official Supabase restore guidance. Resolve version-specific extension or managed-schema differences deliberately; do not suppress errors wholesale.
4. Reconcile the custom Auth trigger and function described above. Confirm the trigger exists exactly once and the function has the expected definition and security properties.
5. Verify required extensions and confirm platform-managed event triggers exist in the new project.
6. Reconfigure Auth providers, email templates, SMTP, Site URL, redirect URLs, API keys/secrets, Edge Functions, Realtime settings, and other dashboard-level configuration as applicable.
7. Restore R2 media objects separately, then verify representative object keys and URLs against `media_assets`.
8. Compare critical application table row counts and check primary keys, foreign keys, indexes, RLS policies, grants, functions, and application queries.
9. Run a controlled login / registration test and verify that the Auth trigger creates the expected `profiles` row.
10. Only switch application environment variables to the recovery project after the recovery project has passed verification and the cutover has been explicitly approved.

The CLI logical dump does not preserve Auth password hashes/sessions or all platform settings. Plan for user password resets / reauthentication where necessary.

## 5. What would provide stronger recovery

If the project later moves to a plan that includes Supabase managed physical backups, use the Dashboard's Database → Backups workflow for database-level point-in-time recovery. Physical database restoration is stronger than a logical dump for preserving managed database state, including database-level schemas, triggers, and extension state.

Even then, keep separate backups / configuration records for Cloudflare R2 objects and platform settings that are not part of PostgreSQL. Supabase documents that Storage API objects are not included in database backups, and restoring a database does not restore files deleted from object storage.

Do not enable paid add-ons or change the organization plan without an explicit cost review and approval.

## 6. Security and retention rules

- Never commit database dumps, Auth user exports, R2 credentials, database passwords, Supabase Access Tokens, or Service Role Keys to GitHub.
- Store backup artifacts encrypted at rest and off-site, with access limited to the owner / authorized operators.
- Keep at least one backup copy independent of the production Supabase project and independent of the production VPS.
- Record backup timestamp, project reference, PostgreSQL version, export method, file sizes, and SHA-256 checksums.
- Verify each backup file is non-empty and its checksum matches after transfer.
- Periodically perform a restore rehearsal in an isolated project. A successful export alone does not prove that restoration works.
- Do not use raw `pg_dump` against all Supabase-managed schemas as an assumed supported substitute for the CLI. Any alternative full-schema experiment must be tested against a disposable target before being treated as recoverable.
- The repository's `production-baseline.sql` remains a structure reference only and must never be represented as a complete backup.
