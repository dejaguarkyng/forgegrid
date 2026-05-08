import { NextRequest, NextResponse } from "next/server";
import { getWorkload, deleteWorkload } from "@/lib/insforge";

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

// ---------------------------------------------------------------------------
// DELETE /api/workloads/[id] — delete a workload by id
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await getWorkload(id);
    if (!existing) {
      return NextResponse.json({ error: "Workload not found" }, { status: 404 });
    }
    await deleteWorkload(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete workload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
