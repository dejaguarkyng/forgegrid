import { NextRequest, NextResponse } from "next/server";
import { createWorkload, updateWorkload } from "@/lib/insforge";
import { submitJungleGridJob } from "@/lib/junglegrid";
import { listSyncedWorkloads } from "@/lib/workload-sync";

// ---------------------------------------------------------------------------
// GET /api/workloads — list recent workloads (newest first)
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const workloads = await listSyncedWorkloads();
    return NextResponse.json(workloads);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list workloads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/workloads — create InsForge record then submit to Jungle Grid
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  const required = ["name", "workload_type", "model_size", "image", "command", "optimize_for"] as const;
  const record = body as Record<string, unknown>;

  for (const field of required) {
    if (!record[field] || typeof record[field] !== "string" || !(record[field] as string).trim()) {
      return NextResponse.json({ error: `Missing or invalid field: ${field}` }, { status: 400 });
    }
  }

  const {
    name,
    workload_type,
    model_size,
    image,
    command,
    optimize_for,
    input_text,
  } = record as {
    name: string;
    workload_type: string;
    model_size: string;
    image: string;
    command: string;
    optimize_for: string;
    input_text?: string;
  };

  // Step 1: Create the InsForge record first (status = submitting)
  let workload;
  try {
    workload = await createWorkload({
      name,
      workload_type,
      model_size,
      image,
      command,
      optimize_for,
      input_text: input_text || undefined,
      status: "submitting",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create workload record";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Step 2: Submit the job to Jungle Grid from the server
  try {
    const environment: Record<string, string> = {};
    if (input_text?.trim()) environment["PROMPT"] = input_text.trim();

    const result = await submitJungleGridJob({
      workload_type,
      model_size,
      image,
      command,
      optimize_for,
      environment,
      metadata: {
        workload_id: workload.id,
        name,
        input_text: input_text || null,
      },
    });

    // Step 3: Persist the Jungle Grid job id and update status to queued
    const updated = await updateWorkload(workload.id, {
      jungle_grid_job_id: result.job_id,
      status: "queued",
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    // Step 4: On failure, update the record to failed
    const message = err instanceof Error ? err.message : "Jungle Grid submission failed";
    try {
      await updateWorkload(workload.id, {
        status: "failed",
        error_message: message,
      });
    } catch {
      // Best effort — original error is still returned
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
