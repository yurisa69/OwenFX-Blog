import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");
const ledgerPath = path.join(root, "supabase", "migration-ledger.json");

const errors = [];
const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
const localByVersion = new Map();

for (const file of files) {
  const match = file.match(/^(\d{14})_([a-z0-9][a-z0-9_-]*)\.sql$/);
  if (!match) {
    errors.push("Invalid migration filename: " + file + ". Use the Supabase CLI-generated 14-digit timestamp format.");
    continue;
  }
  const version = match[1];
  if (localByVersion.has(version)) {
    errors.push("Duplicate local migration version " + version + ": " + localByVersion.get(version) + " and " + file);
    continue;
  }
  localByVersion.set(version, file);
}

let ledger;
try {
  ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
} catch (error) {
  errors.push("Cannot read " + path.relative(root, ledgerPath) + ": " + error.message);
}

if (ledger) {
  if (!Array.isArray(ledger.appliedMigrations)) {
    errors.push("migration-ledger.json must contain an appliedMigrations array.");
  } else {
    const seen = new Set();
    let previous = "";
    for (const entry of ledger.appliedMigrations) {
      const version = entry?.version;
      if (typeof version !== "string" || !/^\d{14}$/.test(version)) {
        errors.push("Invalid applied migration version in ledger: " + String(version));
        continue;
      }
      if (seen.has(version)) {
        errors.push("Duplicate applied migration version in ledger: " + version);
      }
      seen.add(version);
      if (previous && version < previous) {
        errors.push("appliedMigrations must be sorted by version in ascending order.");
      }
      previous = version;
      if (!localByVersion.has(version)) {
        errors.push("Applied production migration " + version + " (" + (entry.name ?? "unnamed") + ") is missing from supabase/migrations.");
      }
    }
  }
}

if (errors.length) {
  console.error("Supabase migration history check failed:");
  for (const error of errors) console.error("- " + error);
  process.exitCode = 1;
} else {
  console.log("Supabase migration history check passed: " + ledger.appliedMigrations.length + " applied production versions are present; " + files.length + " local SQL migrations found.");
  console.log("Additional local migration files are allowed as pending changes.");
}
