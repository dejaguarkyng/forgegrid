import { NextResponse } from "next/server";
import { checkJungleGridHealth } from "@/lib/junglegrid";

// ---------------------------------------------------------------------------
// GET /api/health/integrations
// Response shape: { insforge: "connected" | "failed", jungle_grid: "connected" | "failed" | "not_configured" }
// ---------------------------------------------------------------------------

export async function GET() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Check InsForge
  let insforgeStatus: "connected" | "failed" = "failed";
  const hasInsForgeCredentials =
    !!process.env.INSFORGE_PROJECT_URL &&
    !!process.env.INSFORGE_API_KEY &&
    !!process.env.INSFORGE_PROJECT_ID;

  if (!hasInsForgeCredentials) {
    insforgeStatus = "failed";
  } else {
    try {
      // Use a lightweight rawsql ping instead of listing all workloads
      const projectUrl = process.env.INSFORGE_PROJECT_URL!.replace(/\/$/, "");
      const apiKey = process.env.INSFORGE_API_KEY!;
      const res = await fetch(`${projectUrl}/api/database/advance/rawsql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: "SELECT 1" }),
      });
      insforgeStatus = res.ok ? "connected" : "failed";
    } catch {
      insforgeStatus = "failed";
    }
  }

  // Check Jungle Grid
  let jungleGridStatus: "connected" | "failed" | "not_configured" = "not_configured";
  const hasJungleGridCredentials = !!process.env.JUNGLE_GRID_API_KEY;

  if (!hasJungleGridCredentials) {
    jungleGridStatus = "not_configured";
  } else {
    try {
      const health = await checkJungleGridHealth();
      jungleGridStatus = health.ok ? "connected" : "failed";
    } catch {
      jungleGridStatus = "failed";
    }
  }

  // In demo mode, show explicit demo status rather than faking connectivity
  if (isDemoMode) {
    return NextResponse.json(
      {
        insforge: insforgeStatus,
        jungle_grid: jungleGridStatus,
        demo_mode: true,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    insforge: insforgeStatus,
    jungle_grid: jungleGridStatus,
  });
}
