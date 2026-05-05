import { NextRequest, NextResponse } from "next/server";
import { getWorkload } from "@/lib/insforge";

// ---------------------------------------------------------------------------
// GET /api/workloads/[id] — fetch a single workload by id
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const workload = await getWorkload(id);
    if (!workload) {
      return NextResponse.json({ error: "Workload not found" }, { status: 404 });
    }
    return NextResponse.json(workload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch workload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
