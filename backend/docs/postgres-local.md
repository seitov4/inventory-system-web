# Local PostgreSQL Setup

## Why
Use local PostgreSQL for day-to-day development so SQL behavior, schema checks, transactions, and future AWS RDS deployment stay close to production.

## Local Docker PostgreSQL
The root `docker-compose.yml` already exposes PostgreSQL on `localhost:5432`.

```bash
npm run db:postgres:up
```

If Docker Desktop is not running, start Docker Desktop first and run the command again.

## Local Windows PostgreSQL
This machine can also use a native PostgreSQL service. If `psql` is not in `PATH`, use the full binary path, for example:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432
```

If your active local service is PostgreSQL 17, use:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5432
```

For native PostgreSQL, set `DB_HOST=localhost` and use the local password you configured during PostgreSQL installation.

Use these backend variables for local development:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=postgres_password_here
DB_SSL=false
```

## Initialize Schema
After PostgreSQL is running, apply the schema and default data:

```bash
npm run db:postgres:init
```

This runs `backend/src/db/init.sql` through `backend/scripts/run-init.js`.

## Start Development
```bash
npm run dev
```

Expected backend startup log includes:

```text
PostgreSQL pool initialized successfully
Database: postgres (localhost:5432/inventory_db)
```

## Useful Commands
```bash
npm run db:postgres:up
npm run db:postgres:logs
npm run db:postgres:down
npm --workspace backend run db:check-sync
npm --workspace backend run test
```

## AWS RDS Mapping
For AWS RDS keep the provider the same and change only connection details:

```env
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=inventory
DB_USER=inventory_app
DB_PASSWORD=<secure-password>
DB_SSL=true
```

Run schema initialization during provisioning/deployment, not on every production server startup:

```bash
npm --workspace backend run db:init
```

## Notes
- Do not commit real passwords in `.env`.
- If Postgres is installed locally without Docker, use the same env variables and skip `db:postgres:up`.
