# OwenFX Supabase platform dependencies

Project: `gjzxultalptqwqmpagzj`  
Database engine: PostgreSQL 17.11  
Verified against production catalog: 2026-11-11

This document records project-owned objects that are outside the ordinary `public` table/constraint/index/RLS baseline. It is a recovery checklist, not an instruction to recreate Supabase-managed internals.

## 1. Project-owned database event trigger

- Name: `ensure_rls`
- Event: `ddl_command_end`
- Enabled state at verification: enabled
- Function: `public.rls_auto_enable()`
- Purpose: invoke the project's RLS auto-enable function after DDL commands.

Verified definition:

```sql
CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  EXECUTE FUNCTION public.rls_auto_enable();
```

The function `public.rls_auto_enable()` is included in `schema/production-baseline.sql`. The event trigger is database-wide rather than a public-schema object; its definition is now recorded in that baseline's platform-dependency appendix as well.

Before restoring this object, verify that the target database does not already contain an event trigger with this name and that the function exists. Do not create a duplicate.

## 2. Project-owned Supabase Auth trigger

- Table: `auth.users`
- Trigger: `on_auth_user_created_owenfx`
- Timing: `AFTER INSERT`
- Function: `public.handle_new_owenfx_user()`
- Enabled state at verification: enabled

Verified trigger relationship:

```sql
CREATE TRIGGER on_auth_user_created_owenfx
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_owenfx_user();
```

The function `public.handle_new_owenfx_user()` is included in the public-schema baseline. The trigger is attached to the Supabase-managed Auth schema and is therefore documented separately; it is not part of a public-only schema snapshot.

Before restoring this dependency, verify the function body against the reviewed project source, confirm the trigger is absent, and confirm the intended profile-creation behavior. Do not blindly recreate it.

## 3. Supabase-managed objects excluded

Catalog inspection may show additional event triggers and internal triggers owned by Supabase or its extensions. Those are platform-managed dependencies, not OwenFX-owned objects. Do not export, drop, alter, or recreate them as part of this project's baseline restoration.

## 4. New-project recovery boundary

The public baseline plus this dependency list is not a complete project backup. A working restore also requires separately reviewed handling of Auth configuration and users, extensions, storage/R2 configuration and objects, secrets, API settings, and any other enabled Supabase services.

The eight history-only placeholders in `docs/MIGRATION_HISTORY.md` do not contain original SQL and cannot recreate historical schema changes. No one-command fresh-project bootstrap is currently certified.
