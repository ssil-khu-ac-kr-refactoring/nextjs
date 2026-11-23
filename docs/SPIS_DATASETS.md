# SPIS plasma datasets: deployment and data-safety runbook

This change separates SPIS results into `DMSP_ONLY` and `DMSP_IRI2016` datasets.
The code and migration files may be reviewed and deployed, but this repository task does not
connect to the production database or upload the real CSV.

## Schema migration

Migration `20261123000000_add_spis_datasets`:

1. Creates `spis_datasets` and inserts both dataset definitions.
2. Adds `dataset_id` with a `DMSP_ONLY` default, preserving every existing row and ID.
3. Adds nullable `env_id`, DMSP plasma, and IRI2016 plasma columns.
4. Adds dataset indexes and a restrictive foreign key.

The migration has no `DROP`, table recreation, or update of existing potential values.

## Required production procedure

Do not run these steps until the production owner has approved a maintenance window.

1. Record the current migration status and existing row/value checksums.
2. Create and verify a PostgreSQL backup using the deployment environment's real credentials:

   ```sh
   pg_dump --format=custom --file=ssil-before-spis-datasets.dump "$DATABASE_URL"
   pg_restore --list ssil-before-spis-datasets.dump
   ```

3. Restore that backup into a non-production database and run:

   ```sh
   pnpm exec prisma migrate status
   pnpm exec prisma migrate deploy
   ```

4. Verify existing IDs and values are unchanged and all legacy rows are `DMSP_ONLY`.
5. Only after staging verification, deploy the same migration to production.
6. Validate `DMSP_IRI2016_batch001_DB(3).csv` in the admin UI before confirming replacement.

The container no longer falls back to `prisma db push`; a migration failure stops startup.

## Verification queries

Run read-only queries before and after migration and retain the results:

```sql
SELECT COUNT(*), MIN("id"), MAX("id"), MIN("av_pot"), MAX("av_pot")
FROM "spis_potentials";

SELECT "dataset_id", COUNT(*), COUNT(DISTINCT COALESCE("env_id", "env")),
       COUNT(DISTINCT "node0_mat"), MIN("av_pot"), MAX("av_pot")
FROM "spis_potentials"
GROUP BY "dataset_id";
```

For the supplied DMSP + IRI2016 CSV, the expected values must be checked against the actual file:

- 17,626 valid rows
- 2,518 unique `env_id` values
- 7 materials per environment as defined by the source data
- no duplicate environment/material rows
- no missing Potential values
- source Potential minimum and maximum unchanged

## CSV mapping

| CSV | Database field |
|---|---|
| `env_id` | `env_id` |
| `cond_Solar`, `Kp` | `cond_solar`, `kp` |
| `lat_center`, `ltime_center` | `lat`, `lt` |
| `e_n`, `e_T`, `i_n`, `i_T` | `e_n`, `e_t`, `i_n`, `i_t` |
| `DMSP_e_n`, `DMSP_e_T`, `DMSP_i_n`, `DMSP_i_T` | dedicated `dmsp_*` columns |
| `IRI_e_n`, `IRI_e_T`, `IRI_i_n`, `IRI_i_T` | dedicated `iri_*` columns |
| `node0Material`, `node2Material`, `node` | material/node fields |
| `resistance`, `type`, `Potential` | `res`, `form`, `av_pot` |

`xml_file` and `project_name` are consumed only for import validation and are not stored in
`extras` or exposed by the public API. DMSP and IRI values are never summed or substituted with zero.
