# inventory-system-web
A web-based information system for retail goods accounting with admin panel, product management and analytics.

## Monorepo (npm workspaces)

This repository was migrated to an npm workspaces layout to simplify dependency management and make root-level scripts the primary developer UX.

Workspaces included:
- `frontend`
- `backend`
- `packages/*` (reserved for shared libraries; none extracted yet)

The `mobile/` folder currently contains a placeholder `package.json` and is intentionally excluded from the active workspaces (see notes below).

### Install
From the repository root run:

```bash
npm install
```

This installs dependencies for all workspaces and updates the top-level lockfile.

### Development
Run both frontend and backend concurrently from the root:

```bash
npm run dev
```

Run only frontend or backend:

```bash
npm run dev:frontend
npm run dev:backend
```

The `dev:mobile` script prints information because the mobile app is currently not included in the workspace.

### Database
The backend uses PostgreSQL running on this machine, either through Docker Compose or a native local PostgreSQL service.

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=postgres_password_here
DB_SSL=false
```

Start the local database with Docker Compose:

```bash
npm run db:postgres:up
npm run db:postgres:init
```

Then start the app:

```bash
npm run dev
```

See `backend/docs/postgres-local.md` for a focused local PostgreSQL checklist.

### Database initialization (new, explicit)

To avoid mixing provisioning with runtime in production, the backend no longer applies schema automatically when `NODE_ENV=production`.

- Development (default): the backend applies the PostgreSQL schema on startup for convenience.
- Production: the server will NOT apply schema on startup. If the schema is missing the process will exit with a clear error telling you to run the explicit init command during provisioning.

Run the explicit initialization command:

```bash
npm --workspace backend run db:init
```

There is also an admin-style setup script retained for scripted installs (`db:setup`) and a schema-drift checker (`db:check-sync`). Prefer `db:init` for normal provisioning.

Example: initialize DB during deployment provisioning (example CI step):

```bash
# from repo root
npm --workspace backend run db:init
```


### Build
Build the frontend from the root:

```bash
npm run build
```

### Docker server image
Build a single production image that contains the Express API and the compiled React frontend:

```bash
docker build -t inventory-system-web:latest .
```

Run the local server stack with PostgreSQL:

```bash
JWT_SECRET=change_me docker compose -f docker-compose.prod.yml up --build -d postgres
JWT_SECRET=change_me docker compose -f docker-compose.prod.yml run --rm db-init
JWT_SECRET=change_me docker compose -f docker-compose.prod.yml up -d app
JWT_SECRET=change_me npm --workspace backend run create:test-user
```

The app is served on `http://localhost:5000` by default. Other devices on your LAN can open `http://YOUR_LAPTOP_IP:5000`. Override the published port with `APP_PORT`, for example `APP_PORT=8080`.

The app container does not apply database schema on normal startup. Use the `db-init` command before the first `app` start.
PostgreSQL in the production stack is published only to `127.0.0.1`, so host-side maintenance scripts work but the database is not exposed to the LAN.

### Local server deployment
To use this laptop as the always-on server:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml --profile init run --rm db-init
```

Then open:

```text
http://localhost:5000
http://YOUR_LAPTOP_IP:5000
```

If you want frontend dev mode on the network too, run CRA with `HOST=0.0.0.0`.

### Test & Lint
Run frontend tests from root:

```bash
npm run test
```

Lint is currently a per-package responsibility; run package-specific lint scripts if/when added.

### mobile/ handling
The `mobile` folder currently appears to be a native/mobile app that is not yet configured to be a first-class npm workspace package. To avoid adding a fake shared package or introducing risk, `mobile` has been excluded from `workspaces` for now. When mobile is ready to be managed by npm workspaces, update the root `package.json` `workspaces` array to include `mobile` and make sure `mobile/package.json` declares real dependencies and scripts.

### Adding shared code
If/when a truly shared module is identified (shared utils, constants, or config), move it into `packages/<name>` and add it to `workspaces` — the migration avoided creating a placeholder `packages/*` package until it's actually needed.

### CI (basic)
A simple GitHub Actions workflow is included to run `npm install`, `npm run build`, and basic checks on push/PR.

### Removed dead layers
During a cleanup, the following unused/empty files were removed to avoid misleading project architecture:

- `frontend/redux/*` — Redux slices and store were empty and the app uses React Context; removed.
- `backend/src/models/*` — model files were empty and services interact with the DB directly; removed.
- `backend/src/utils/logger.js` — empty and not imported; logging is currently inline.
- `backend/src/utils/validate.js` — empty and not imported; validation is performed in services/controllers.

If you preferred these as placeholders for future refactors, we can reintroduce them with real implementations; for now they were removed to keep the repository honest about current architecture.

### Consolidated product API
The repository previously exposed two parallel endpoints for the same domain concept: `/api/products` and `/api/items`. The `items` endpoints were a thin wrapper that delegated to the products service and did not represent a distinct domain entity.

Action taken:
- `/api/items` route and `items` controller were removed. `/api/products` is the canonical API for product/item CRUD and imports in the frontend have been verified to use it.

If you need a backward-compatible alias for external integrators, we can add `/api/items` as a temporary proxy that logs a deprecation warning and forwards requests to `/api/products`.
