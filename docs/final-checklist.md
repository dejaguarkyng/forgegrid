# Final QA Checklist

Pre-demo punch list. Work through this before recording.

---

## Secret Handling

- [ ] `JUNGLE_GRID_API_KEY` is only read in server-side code (`lib/junglegrid.ts`, API routes)
- [ ] No Jungle Grid credentials appear in any `NEXT_PUBLIC_*` variable
- [ ] No Jungle Grid credentials are returned in any API response
- [ ] InsForge credentials are only read in `lib/insforge.ts`

---

## Environment Behavior

- [ ] App works without `JUNGLE_GRID_API` set (default production base URL is used)
- [ ] No `JUNGLE_GRID_API_URL` or `BASE_URL` variable was introduced
- [ ] `NEXT_PUBLIC_DEMO_MODE` defaults to off — never `true` unless explicitly set in `.env.local`

---

## API Route Correctness

- [ ] `POST /api/workloads` — validates fields, creates InsForge record first, submits to Jungle Grid, stores job id
- [ ] `GET /api/workloads` — returns InsForge records newest-first
- [ ] `GET /api/workloads/[id]` — returns single record or 404
- [ ] `POST /api/workloads/[id]/refresh` — reads workload, checks job id exists, fetches JG state, persists back to InsForge
- [ ] `GET /api/health/integrations` — returns `{ insforge, jungle_grid }` with exact allowed values

---

## Workload Submit Flow

- [ ] InsForge record is created with status `submitting` before the Jungle Grid call
- [ ] On success: `jungle_grid_job_id` stored, status updated to `queued`
- [ ] On failure: status updated to `failed`, `error_message` populated
- [ ] Failed submit never returns a success response to the client

---

## Refresh Flow

- [ ] Refresh reads `jungle_grid_job_id` from InsForge before calling Jungle Grid
- [ ] Missing `jungle_grid_job_id` returns a clear 400 error
- [ ] Status, logs, output, and error_message are all updated in InsForge
- [ ] Status mapping is deterministic (queued/running/completed/failed only)

---

## UI — Status Colors & Labels

| Status | Color |
|--------|-------|
| draft | gray |
| submitting | yellow |
| queued | blue |
| running | purple |
| completed | green |
| failed | red |

- [ ] All six status variants render with the correct color in the workload list
- [ ] Status badge appears in the detail pane header

---

## UI — Loading & Empty States

- [ ] Dashboard initial load shows a loading skeleton for the workload list
- [ ] Empty list shows an explicit empty state message
- [ ] Form shows a spinner and disabled state during submission
- [ ] Refresh button shows a spinner during in-flight request
- [ ] Detail pane shows an explicit "no selection" state when nothing is selected

---

## UI — Error States

- [ ] Submission failure shows an error message in the form
- [ ] List fetch failure shows an error message in the list region
- [ ] Refresh failure shows an error message in the detail pane
- [ ] Missing credentials show a clear setup error in the health banner

---

## Health Banner

- [ ] Health banner is always visible at the top of the dashboard
- [ ] InsForge and Jungle Grid statuses are shown separately
- [ ] Banner shows an explanation when credentials are missing or checks fail
- [ ] Demo mode label is shown when `NEXT_PUBLIC_DEMO_MODE=true`

---

## Missing Credentials

- [ ] Missing InsForge credentials → health banner shows "Failed" for InsForge with an explanatory note
- [ ] Missing Jungle Grid credentials → health banner shows "Not configured" for Jungle Grid
- [ ] App does not silently pretend to be connected
- [ ] App does not fall back to mock data or fake workloads

---

## Responsive Layout

- [ ] Landing page reads cleanly on mobile and desktop
- [ ] Dashboard columns stack on mobile (form → list → detail)
- [ ] Form fields are usable on small screens
- [ ] Detail pane panels are readable on small screens

---

## End-to-End Demo Rehearsal

Follow this exact click path:

1. Open `/` — verify title, subtitle, role cards, architecture strip
2. Click **Launch Demo** — land on `/dashboard`
3. Verify health banner shows integration status at top
4. Review pre-filled form defaults (name, workload_type, model_size, image, command, optimize_for, input_text)
5. Click **Submit Workload** — observe submitting spinner
6. Watch new item appear in Recent Workloads with status **Queued**
7. Select the new workload — detail pane opens
8. Verify metadata: name, id, jungle grid job id, image, command, timestamps
9. Click **Refresh status** — observe refreshing spinner
10. Verify status updates (queued → running → completed)
11. Verify Logs and Output panels populate after refresh
12. If a failure scenario is needed: confirm error panel shows `error_message` in red
