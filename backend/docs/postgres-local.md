# Local PostgreSQL Setup

## Why
Use local PostgreSQL on this machine so the laptop can act as both the app server and the database server.

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

## Server Mode
For a local server on this laptop, keep these values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=postgres_password_here
DB_SSL=false
```

To make the app available to other devices on the same network, run the production compose stack and open `http://<laptop-ip>:5000`.

## Notes
- Do not commit real passwords in `.env`.
- If Postgres is installed locally without Docker, use the same env variables and skip `db:postgres:up`.
