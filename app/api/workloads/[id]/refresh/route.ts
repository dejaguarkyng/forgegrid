import { NextRequest, NextResponse } from "next/server";
import { getWorkload } from "@/lib/insforge";
import { syncWorkload } from "@/lib/workload-sync";

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

  try {
    const updated = await syncWorkload(workload);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync workload";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
