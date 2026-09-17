# IMEI Checker database layer

The existing result-page UI is intentionally outside this folder and must not be changed by database population work.

## Runtime database

The deployed API already uses Supabase tables such as `brands`, `phones`, `tac_allocations`, and the `v_tac_lookup` view. The public lookup extracts the first 8 digits as TAC and resolves that TAC against the database.

`schema.sql` and `repository.js` document a D1/SQLite-compatible future storage contract. They are not a replacement for the current Supabase runtime.

## Bulk population

1. Prepare an authorized JSON dataset using `device-import.example.json` as the shape.
2. Real TAC values go in `tacs`. Do not invent TACs and do not import TAC datasets without permission/licensing.
3. Generate SQL for the existing Supabase schema:

```bash
node scripts/import-device-database-supabase.mjs devices.json supabase-device-import.sql
```

4. Review the generated SQL and execute it in the project's Supabase SQL editor or migration pipeline.
5. Existing TAC rows are not overwritten. Existing phone slugs are not duplicated.

## Local/synthetic TACs

`api/data/local-device-tacs.json` contains project-local `99xxxxxx` identifiers used by the IMEI generator for devices that do not have an exact real TAC mapping. These are application identifiers, not claims of GSMA TAC allocation, and must remain clearly separated from real TAC data.

## Lookup behavior

The current API lookup order remains unchanged: project-local generated TAC mapping first, then `v_tac_lookup`, then conservative phone matching. Database population should improve exact matches without requiring any result-page redesign.
