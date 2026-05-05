# Schema: workloads

The `workloads` table is the single source of truth for all AI workload state in ForgeGrid.

## Table Definition (InsForge)

```sql
CREATE TABLE workloads (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text,
  name            text          NOT NULL,
  workload_type   text          NOT NULL,
  model_size      text          NOT NULL,
  image           text          NOT NULL,
  command         text          NOT NULL,
  optimize_for    text          NOT NULL,
  input_text      text,
  status          text          NOT NULL DEFAULT 'draft',
  jungle_grid_job_id text,
  logs            text,
  output          text,
  error_message   text,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);
```

## Status Lifecycle

```
draft → submitting → queued → running → completed
                                      ↘ failed
```

| Status | Meaning |
|--------|---------|
| `draft` | Record created, not yet submitted to Jungle Grid |
| `submitting` | InsForge record saved; Jungle Grid job submission in progress |
| `queued` | Jungle Grid accepted the job; waiting for execution slot |
| `running` | Jungle Grid is actively executing the workload |
| `completed` | Workload finished successfully; output available |
| `failed` | Submission or execution failed; `error_message` populated |

## Field Notes

- `jungle_grid_job_id` is null until the submission succeeds
- `logs`, `output`, and `error_message` are populated by the refresh route
- `updated_at` should be updated on every status change
