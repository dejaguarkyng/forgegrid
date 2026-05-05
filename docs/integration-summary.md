# Integration Summary

## InsForge

**Role:** Backend state layer. InsForge stores all workload records, submission metadata, and every status transition. The UI never has its own database — all persistence flows through InsForge.

**Operations used by this app:**
- Create record (`workloads` table)
- Fetch single record by id
- List records ordered by `created_at desc`
- Update record fields (status, jungle_grid_job_id, logs, output, error_message)

**Integration approach:**
- All InsForge calls are server-side only (API routes and server components)
- Credentials read from `INSFORGE_PROJECT_URL`, `INSFORGE_API_KEY`, `INSFORGE_PROJECT_ID`
- Isolated entirely in `lib/insforge.ts` — no direct calls from UI components or route files

## Jungle Grid

**Role:** Remote AI execution layer. Jungle Grid receives job submissions, runs workloads on GPU infrastructure, and exposes status/logs/output over REST.

**Authentication:** Bearer auth via `Authorization: Bearer <JUNGLE_GRID_API_KEY>`.

**Base URL behavior:**
- Default production base URL is implied by Jungle Grid docs — no custom env var needed for standard use
- Optional `JUNGLE_GRID_API` env var overrides the base for non-default environments only
- Do **not** introduce `JUNGLE_GRID_API_URL` or `BASE_URL`

**Endpoints used:**

| Purpose | Route |
|---------|-------|
| Submit job | `POST /v1/jobs` |
| Job status | `GET /v1/jobs/{job_id}` |
| Job logs / runtime output | `GET /v1/jobs/{job_id}/logs` |
| Health check | `GET /v1/health` |

> **Uncertainty note:** Exact Jungle Grid response field names (e.g. job status string values, log field key) may differ from the summary above. All response parsing and field normalization is localized inside `lib/junglegrid.ts` with explicit TODO comments. No UI component or route handler should depend on raw Jungle Grid response shapes.

**Calls are always server-side.** Jungle Grid credentials must never appear in `NEXT_PUBLIC_*` variables or be exposed to the browser.
