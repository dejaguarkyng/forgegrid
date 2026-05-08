/**
 * lib/insforge.ts
 *
 * Single InsForge integration point for ForgeGrid.
 * All InsForge initialization and workload record access is isolated here.
 * API routes must use these helpers — never call InsForge directly elsewhere.
 *
 * InsForge exposes data via a rawsql endpoint:
 *   POST {projectUrl}/api/database/advance/rawsql
 *   Authorization: Bearer {apiKey}
 */

export type WorkloadStatus =
  | "draft"
  | "submitting"
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface Workload {
  id: string;
  user_id: string | null;
  name: string;
  workload_type: string;
  model_size: string;
  image: string;
  command: string;
  optimize_for: string;
  input_text: string | null;
  status: WorkloadStatus;
  jungle_grid_job_id: string | null;
  logs: string | null;
  output: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkloadData {
  name: string;
  workload_type: string;
  model_size: string;
  image: string;
  command: string;
  optimize_for: string;
  input_text?: string;
  status?: WorkloadStatus;
  user_id?: string;
}

export interface UpdateWorkloadData {
  status?: WorkloadStatus;
  jungle_grid_job_id?: string | null;
  logs?: string | null;
  output?: string | null;
  error_message?: string | null;
}

function getInsForgeConfig() {
  const projectUrl = process.env.INSFORGE_PROJECT_URL;
  const apiKey = process.env.INSFORGE_API_KEY;

  if (!projectUrl || !apiKey) {
    throw new Error(
      "InsForge credentials are not configured. Set INSFORGE_PROJECT_URL and INSFORGE_API_KEY."
    );
  }

  return { projectUrl: projectUrl.replace(/\/$/, ""), apiKey };
}

async function rawsql<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const { projectUrl, apiKey } = getInsForgeConfig();

  const body: { query: string; params?: unknown[] } = { query: sql };
  if (params && params.length > 0) body.params = params;

  const res = await fetch(`${projectUrl}/api/database/advance/rawsql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`InsForge SQL failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return (data.rows ?? data.data ?? []) as T[];
}

/**
 * Create a new workload record in InsForge.
 */
export async function createWorkload(data: CreateWorkloadData): Promise<Workload> {
  const status = data.status ?? "draft";
  const now = new Date().toISOString();

  const rows = await rawsql<Workload>(
    `INSERT INTO workloads
       (name, workload_type, model_size, image, command, optimize_for,
        input_text, status, user_id, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      data.name,
      data.workload_type,
      data.model_size,
      data.image,
      data.command,
      data.optimize_for,
      data.input_text ?? null,
      status,
      data.user_id ?? null,
      now,
    ]
  );

  if (!rows[0]) throw new Error("InsForge createWorkload returned no record");
  return rows[0];
}

/**
 * List workloads ordered by created_at descending (newest first).
 */
export async function listWorkloads(): Promise<Workload[]> {
  return rawsql<Workload>(
    "SELECT * FROM workloads ORDER BY created_at DESC"
  );
}

/**
 * Fetch a single workload by id.
 */
export async function getWorkload(id: string): Promise<Workload | null> {
  const rows = await rawsql<Workload>(
    "SELECT * FROM workloads WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Delete a workload record by id.
 */
export async function deleteWorkload(id: string): Promise<void> {
  await rawsql("DELETE FROM workloads WHERE id = $1", [id]);
}

/**
 * Update a workload record's fields.
 */
export async function updateWorkload(
  id: string,
  data: UpdateWorkloadData
): Promise<Workload> {
  const now = new Date().toISOString();

  // Build SET clause dynamically from provided fields
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(data.status);
  }
  if (data.jungle_grid_job_id !== undefined) {
    fields.push(`jungle_grid_job_id = $${idx++}`);
    values.push(data.jungle_grid_job_id);
  }
  if (data.logs !== undefined) {
    fields.push(`logs = $${idx++}`);
    values.push(data.logs);
  }
  if (data.output !== undefined) {
    fields.push(`output = $${idx++}`);
    values.push(data.output);
  }
  if (data.error_message !== undefined) {
    fields.push(`error_message = $${idx++}`);
    values.push(data.error_message);
  }

  fields.push(`updated_at = $${idx++}`);
  values.push(now);
  values.push(id); // for WHERE clause

  const sql = `UPDATE workloads SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;

  const rows = await rawsql<Workload>(sql, values);
  if (!rows[0]) throw new Error(`InsForge updateWorkload: no record found for id ${id}`);
  return rows[0];
}
