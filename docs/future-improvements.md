# Future improvements

This file records cleanup items that were intentionally not changed because they need product or architectural decisions.

## Reconciliation

- Replace local duplicate merge simulation in `frontend/src/pages/Reconciliation/ReconciliationPage.jsx` with a real backend endpoint.
- Remove the temporary merged product ID generated with `Date.now() + Math.random()` after backend merge exists.
- Add tests for duplicate detection and merge behavior.

## Documentation

- Review `REFACTORING_PLAN.md`. It references old mock-product extraction work and may now be obsolete.
- Decide whether to restore, replace, or permanently remove `docs/design-system.md`; it was already deleted before this cleanup task.

## Environment and deployment

- Keep `docker-compose.yml` and `.env.example` as local-development examples, but create a separate production `.env.production.example` with no dev/ngrok defaults.
- Document when to enable `CORS_ORIGINS=https://*.ngrok-free.dev` for mobile testing.
- Consider changing `REACT_APP_ML_API_URL` production defaults once the deployed ML service URL is finalized.

## Logging

- Replace backend startup `console.log` calls with a structured logger.
- Keep request bodies, JWTs, passwords, and auth headers out of logs.

## Dependencies

- Run a focused dependency audit before removing packages from `package.json`.
- Validate dependency removals with frontend build/tests, backend lint/tests, and Docker build.

## ML service

- Review `ml-service` fallback behavior and model artifacts separately.
- Keep the service unless production deployment no longer uses forecasting.

