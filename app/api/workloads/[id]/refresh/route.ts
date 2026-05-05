import { NextRequest, NextResponse } from "next/server";
import { getWorkload, updateWorkload } from "@/lib/insforge";
import { getJungleGridJobStatus, getJungleGridJobLogs } from "@/lib/junglegrid";

// ---------------------------------------------------------------------------
// POST /api/workloads/[id]/refresh
// Sync Jungle Grid job state back into InsForge
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Read the current workload record
  let workload;
  try {
    workload = await getWorkload(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch workload";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!workload) {
    return NextResponse.json({ error: "Workload not found" }, { status: 404 });
  }

  // Confirm a Jungle Grid job id exists before querying
  if (!workload.jungle_grid_job_id) {
    return NextResponse.json(
      { error: "No Jungle Grid job id on this workload. Has it been submitted?" },
      { status: 400 }
    );
  }

  // Fetch status and logs from Jungle Grid
  let newStatus = workload.status;
  let logs = workload.logs ?? "";
  let output = workload.output ?? "";
  let error_message = workload.error_message ?? null;

  try {
    const jobState = await getJungleGridJobStatus(workload.jungle_grid_job_id);

    // Only transition to a known status; keep existing if ambiguous
    const validTransitions: typeof newStatus[] = ["queued", "running", "completed", "failed"];
    if (validTransitions.includes(jobState.status)) {
      newStatus = jobState.status;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch Jungle Grid status";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Fetch logs when the job has started or finished
  if (newStatus === "running" || newStatus === "completed" || newStatus === "failed") {
    try {
      const jobLogs = await getJungleGridJobLogs(workload.jungle_grid_job_id);
      logs = jobLogs.logs;
      output = jobLogs.output;
    } catch {
      // Non-fatal — logs may not be available yet
    }
  }

  if (newStatus === "failed" && !error_message) {
    error_message = "Job failed on Jungle Grid. Check logs for details.";
  }

  // Persist refreshed fields to InsForge
  try {
    const updated = await updateWorkload(id, {
      status: newStatus,
      logs,
      output,
      error_message,
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update workload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
