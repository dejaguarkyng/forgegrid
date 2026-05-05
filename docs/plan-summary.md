# ForgeGrid — Plan Summary

## What ForgeGrid Is

ForgeGrid is a founder-demo-quality Next.js application. It is not a generic admin panel.  
Users submit AI workloads from a clean dashboard, **InsForge** persists every state change, and **Jungle Grid** executes the workload remotely.

## App Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page — product framing and architecture strip |
| `/dashboard` | Main demo workspace — health banner, form, list, detail pane |

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/workloads` | Create record in InsForge, then submit job to Jungle Grid |
| `GET` | `/api/workloads` | Return recent workloads from InsForge (newest first) |
| `GET` | `/api/workloads/[id]` | Fetch single workload record |
| `POST` | `/api/workloads/[id]/refresh` | Sync Jungle Grid status/logs/output back into InsForge |
| `GET` | `/api/health/integrations` | Check InsForge and Jungle Grid connectivity |

## Health Route Response Shape

```json
{ "insforge": "connected" | "failed", "jungle_grid": "connected" | "failed" | "not_configured" }
```

## Integration Wrappers

Exactly two files — no exceptions:

- `lib/insforge.ts` — all InsForge initialization and record access
- `lib/junglegrid.ts` — all Jungle Grid HTTP calls, Bearer auth, and response normalization

## Workload Status Enum

`draft` → `submitting` → `queued` → `running` → `completed` / `failed`

| Status | Color |
|--------|-------|
| `draft` | gray |
| `submitting` | yellow |
| `queued` | blue |
| `running` | purple |
| `completed` | green |
| `failed` | red |

## Jungle Grid Payload Contract

```ts
{
  workload_type: string;
  model_size: string;
  image: string;
  command: string;
  optimize_for: string;
  metadata: Record<string, unknown>;
}
```

## Demo Proof Points (Operation Order)

1. Create workload record in InsForge with status `submitting`
2. Submit the real job to Jungle Grid from a server route
3. Store the returned Jungle Grid `job_id` in InsForge, set status `queued`
4. On failure: update status to `failed`, store `error_message`
5. On refresh: pull latest status/logs/output from Jungle Grid, persist back to InsForge

## Global Constraints

- Jungle Grid secrets **must remain server-side**; never in `NEXT_PUBLIC_*` variables
- `NEXT_PUBLIC_DEMO_MODE=true` is the **only** allowed way to enable demo mode
- Demo mode must **never** be on by default
- The app must **never silently fake connectivity**
- Any Jungle Grid response-shape uncertainty must be isolated in `lib/junglegrid.ts` with explicit TODO comments
- Later tasks must stop after their scoped work and must not drift into unrelated implementation
