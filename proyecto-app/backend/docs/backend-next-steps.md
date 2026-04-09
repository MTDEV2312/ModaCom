# Backend Next Steps (Post-Completion)

This file tracks improvements after backend core completion.

## 1) CI Docker-Only Pipeline

Goal:
- Run migrations + integration tests in CI exactly as local docker workflow.

Tasks:
- Add CI workflow for docker compose startup, migrate, test, and teardown.
- Fail fast on migration/test errors.
- Publish test logs/artifacts.

## 2) Operational Observability

Goal:
- Detect delivery/auth anomalies before users report incidents.

Tasks:
- Add structured logs for auth recovery/reset (include request correlation id).
- Emit metrics for:
  - recover-password requests
  - reset-password success/failure
  - provider delivery failures
- Add alerts for spikes in 429/500 and provider failures.

## 3) Email Deliverability Hardening

Goal:
- Increase inbox placement and reduce silent delivery issues.

Tasks:
- Verify SPF, DKIM, DMARC for sending domain.
- Track bounce/complaint events from provider webhooks.
- Build periodic deliverability checks and dashboards.

## 4) Security Hardening (Optional Layer)

Goal:
- Add friction against abuse while preserving UX.

Tasks:
- Optional CAPTCHA or challenge step on recover-password endpoint.
- Optional per-account throttling in addition to per-IP in-memory limits.
- Consider moving rate-limit store to Redis for multi-instance consistency.

## 5) Technical Cleanup

Goal:
- Remove dead/duplicated route definitions and keep API surface explicit.

Tasks:
- Remove duplicated `GET /offers/all` route declaration in catalog router.
- Add route-level tests to detect accidental duplicate path declarations.

## 6) API Contract Governance

Goal:
- Keep backend/frontend API contracts stable over time.

Tasks:
- Add API snapshot tests for key responses.
- Define versioning/deprecation policy for future v2 changes.
- Keep `backend/docs/api-reference.md` updated per release.

## 7) Long-Term ID Strategy

Goal:
- Resolve ID strategy explicitly and avoid mixed conventions later.

Tasks:
- Decide between:
  - Keep numeric IDs in DB and serialize to string in API
  - Migrate to UUID end-to-end
- Document migration path if UUID is chosen.
