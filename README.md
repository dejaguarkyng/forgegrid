# ForgeGrid

A founder-demo-quality Next.js app showing how InsForge and Jungle Grid work together to power a real AI workload workflow.

**InsForge** stores every backend record and status transition. **Jungle Grid** executes the submitted workloads on remote GPU infrastructure. The web app never pretends compute happens inside it.

---

## Why InsForge + Jungle Grid

| Layer | Role |
|-------|------|
| InsForge | Persists workload records, submission metadata, job ids, logs, and status updates |
| Jungle Grid | Accepts job submissions from a secure server route and returns execution results |

Together they let a small team demonstrate a complete AI product flow — submit a job, track its state, and retrieve results — without managing infrastructure.

---

## Required Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials.

```bash
cp .env.example .env.local
```

| Variable | Required | Notes |
|----------|----------|-------|
| `INSFORGE_PROJECT_URL` | Yes | InsForge project REST endpoint |
| `INSFORGE_API_KEY` | Yes | InsForge API key |
| `INSFORGE_PROJECT_ID` | Yes | InsForge project id |
| `JUNGLE_GRID_API_KEY` | Yes | Jungle Grid API key |
| `JUNGLE_GRID_API` | No | Override Jungle Grid base URL (default production base is used when unset) |
| `NEXT_PUBLIC_DEMO_MODE` | No | Set to `true` to enable demo mode — never on by default |

> Jungle Grid credentials must remain server-side. Never use `NEXT_PUBLIC_*` for them.

---

## Setup & Local Run

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in .env.local with your credentials

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
User → POST /api/workloads
         ↓
  InsForge: create record (status: submitting)
         ↓
  Jungle Grid: submit job (server-side, Bearer auth)
         ↓
  InsForge: store job_id (status: queued)
         ↓
  Dashboard: POST /api/workloads/[id]/refresh
         ↓
  Jungle Grid: fetch status + logs
         ↓
  InsForge: persist status, logs, output, error
         ↓
  Dashboard: re-render with current state
```

The record is always created in InsForge before the Jungle Grid call. The dashboard always has state to display, even if the remote job fails.

---

## Demo Recording Guide

1. **Landing page intro** — Navigate to `/`. Walk through the title, subtitle, role cards, and architecture strip. One sentence each on InsForge and Jungle Grid.
2. **Dashboard health check** — Click Launch Demo. Show the health banner at the top. Confirm InsForge and Jungle Grid show "Connected".
3. **Workload submission** — The form is pre-filled with demo defaults. Click "Submit Workload". Watch the submitting state, then see the new entry appear in the Recent Workloads list with status "Queued".
4. **Refresh and result walkthrough** — Select the workload from the list. Show the Workload Details pane. Click "Refresh status". Show status updating to Running, then Completed. Walk through the Logs and Output panels.

---

## Founder Script

> ForgeGrid is a lightweight demo that shows how quickly an AI product team can stand up a real workload workflow with InsForge and Jungle Grid. On the front end, we give users a clean interface to submit a job and inspect its current state. Under the hood, InsForge stores the workload record, the submission metadata, and every status update we care about. Jungle Grid handles the actual remote execution, so we are not pretending compute happens inside the web app. When a job is submitted, ForgeGrid creates backend state in InsForge first, sends the workload to Jungle Grid from a secure server route, stores the returned job id, and then lets the dashboard refresh logs, output, and final status back into InsForge. The result is a compact founder demo that clearly shows a modern backend platform paired with real AI infrastructure.

---

## Project Structure

```
app/
  page.tsx                          # Landing page (/)
  dashboard/page.tsx                # Dashboard (/dashboard)
  api/
    workloads/route.ts              # GET + POST /api/workloads
    workloads/[id]/route.ts         # GET /api/workloads/[id]
    workloads/[id]/refresh/route.ts # POST /api/workloads/[id]/refresh
    health/integrations/route.ts    # GET /api/health/integrations
components/dashboard/
  health-banner.tsx
  workload-form.tsx
  workload-list.tsx
  workload-detail.tsx
lib/
  insforge.ts                       # InsForge integration wrapper
  junglegrid.ts                     # Jungle Grid integration wrapper
docs/
  plan-summary.md
  integration-summary.md
  schema.md
  final-checklist.md
```
