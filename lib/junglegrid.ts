/**
 * lib/junglegrid.ts
 *
 * Single Jungle Grid integration point for ForgeGrid.
 * All Jungle Grid HTTP calls, Bearer auth, endpoint selection, and
 * response normalization are isolated here.
 *
 * Any vendor response-shape uncertainty is marked with TODO comments.
 * Route handlers and UI must not depend on raw Jungle Grid response shapes.
 */

import type { WorkloadStatus } from "./insforge";

// ---------------------------------------------------------------------------
// Types — stable app-facing contracts
// ---------------------------------------------------------------------------

export interface JungleGridPayload {
  workload_type: string;
  model_size: string;
  image: string;
  command: string;
  optimize_for: string;
  environment?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface JungleGridJobResult {
  job_id: string;
}

export interface JungleGridJobState {
  job_id: string;
  /** Normalized to the app WorkloadStatus enum */
  status: WorkloadStatus;
  raw_status: string;
}

export interface JungleGridJobLogs {
  logs: string;
  output: string;
}

interface JungleGridLogItem {
  created_at?: string;
  stream?: string;
  message?: string;
}

export interface JungleGridHealthResult {
  ok: boolean;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getJungleGridConfig() {
  const apiKey = process.env.JUNGLE_GRID_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Jungle Grid credentials are not configured. Set JUNGLE_GRID_API_KEY."
    );
  }

  // Optional base URL override. Default production base is used when unset.
  // Do NOT introduce JUNGLE_GRID_API_URL — use JUNGLE_GRID_API only.
  const base = (process.env.JUNGLE_GRID_API ?? "https://api.junglegrid.dev").replace(/\/$/, "");

  return { apiKey, base };
}

function jungleGridHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Parse a model size string like "7b", "13b", "70b", "3b" into a GB float.
 * Falls back to 7 if the value cannot be parsed.
 */
function parseModelSizeGb(modelSize: string): number {
  const match = modelSize.toLowerCase().match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 7;
}

/**
 * Map app optimize_for values to the Jungle Grid accepted values.
 * Jungle Grid accepts: "cost", "speed", "balanced"
 */
function normalizeOptimizeFor(value: string): "cost" | "speed" | "balanced" {
  if (value === "cost") return "cost";
  if (value === "speed" || value === "latency" || value === "throughput") return "speed";
  return "balanced";
}

// ---------------------------------------------------------------------------
// Status normalization
// ---------------------------------------------------------------------------

/**
 * Map raw Jungle Grid job status strings to the app WorkloadStatus enum.
 * TODO: Verify exact Jungle Grid status string values from live API docs.
 * Extend the map below when confirmed values are known.
 */
function normalizeStatus(raw: string): WorkloadStatus {
  const lower = raw.toLowerCase();
  if (lower === "queued" || lower === "pending" || lower === "waiting") return "queued";
  if (lower === "running" || lower === "executing" || lower === "active") return "running";
  if (lower === "completed" || lower === "succeeded" || lower === "done" || lower === "success") return "completed";
  if (lower === "failed" || lower === "error" || lower === "cancelled" || lower === "canceled") return "failed";
  // Keep existing status unknown — caller should preserve current status
  return "queued";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Submit a workload job to Jungle Grid.
 * Returns the job_id for persisting in InsForge.
 */
export async function submitJungleGridJob(
  payload: JungleGridPayload
): Promise<JungleGridJobResult> {
  const { apiKey, base } = getJungleGridConfig();

  const body = {
    name: payload.metadata?.name ?? payload.workload_type,
    workload_type: payload.workload_type,
    model_size_gb: parseModelSizeGb(payload.model_size),
    image: payload.image,
    command: payload.command || undefined,
    optimize_for: normalizeOptimizeFor(payload.optimize_for),
    environment: payload.environment ?? {},
    metadata: payload.metadata ?? {},
  };

  const res = await fetch(`${base}/v1/jobs`, {
    method: "POST",
    headers: jungleGridHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jungle Grid submitJob failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  const job_id: string = data.job_id ?? data.id ?? data.jobId;
  if (!job_id) {
    throw new Error(
      `Jungle Grid submitJob returned an unrecognized response shape: ${JSON.stringify(data)}`
    );
  }

  return { job_id };
}

/**
 * Get the current execution status of a Jungle Grid job.
 */
export async function getJungleGridJobStatus(
  jobId: string
): Promise<JungleGridJobState> {
  const { apiKey, base } = getJungleGridConfig();

  const res = await fetch(`${base}/v1/jobs/${encodeURIComponent(jobId)}`, {
    headers: jungleGridHeaders(apiKey),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jungle Grid getJobStatus failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  const rawStatus: string = data.status ?? data.state ?? "unknown";

  return {
    job_id: jobId,
    status: normalizeStatus(rawStatus),
    raw_status: rawStatus,
  };
}

/**
 * Get logs and runtime output for a completed or running Jungle Grid job.
 */
export async function getJungleGridJobLogs(
  jobId: string
): Promise<JungleGridJobLogs> {
  const { apiKey, base } = getJungleGridConfig();

  // Jungle Grid log entries are exposed via GET /v1/jobs/{job_id}/logs.
  // Convert the vendor stream format into the app's stable logs/output shape.
  const res = await fetch(`${base}/v1/jobs/${encodeURIComponent(jobId)}/logs`, {
    headers: jungleGridHeaders(apiKey),
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 204) {
      return { logs: "", output: "" };
    }
    const text = await res.text();
    throw new Error(`Jungle Grid getJobLogs failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? (data.items as JungleGridLogItem[]) : [];

  const logsFromItems = items
    .map((item) => {
      const message = item.message ?? "";
      if (!message) return "";

      const labels = [item.created_at, item.stream].filter(Boolean);
      const prefix = labels.length > 0 ? `[${labels.join(" ")}] ` : "";
      return `${prefix}${message}`;
    })
    .filter(Boolean)
    .join("\n");

  const outputFromItems = items
    .filter((item) => item.stream === "stdout")
    .map((item) => item.message ?? "")
    .filter(Boolean)
    .join("\n");

  const logs: string =
    logsFromItems || (data.logs ?? data.stdout ?? data.log ?? "");
  // Prefer a dedicated output/result field from the API over stdout stream items,
  // which only contain process lifecycle messages.
  const output: string =
    (data.output ?? data.result ?? data.response ?? "") || outputFromItems;

  return { logs: sanitizeLogs(logs), output: sanitizeLogs(output) };
}

/**
 * Strip vendor-specific branding from log/output strings.
 */
function sanitizeLogs(text: string): string {
  return text
    .replace(/\bRunPod\b/gi, "ForgeGrid")
    .split("\n")
    .filter((line) => !/managed\s+forgegrid/i.test(line))
    .join("\n")
    .trim();
}

/**
 * Check whether the Jungle Grid API is reachable and responsive.
 */
export async function checkJungleGridHealth(): Promise<JungleGridHealthResult> {
  const { apiKey, base } = getJungleGridConfig();

  try {
    // Use GET /v1/nodes (public capacity discovery) as a lightweight health probe
    const res = await fetch(`${base}/v1/nodes`, {
      headers: jungleGridHeaders(apiKey),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
