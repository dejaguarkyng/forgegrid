"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
  insforge: "connected" | "failed";
  jungle_grid: "connected" | "failed" | "not_configured";
  demo_mode?: boolean;
}

const statusConfig = {
  connected: { label: "Connected", dot: "bg-emerald-400", text: "text-emerald-400" },
  failed: { label: "Failed", dot: "bg-red-400", text: "text-red-400" },
  not_configured: { label: "Not configured", dot: "bg-yellow-400", text: "text-yellow-400" },
};

export default function HealthBanner() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health/integrations")
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not reach health endpoint");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-3 text-sm text-white/40 animate-pulse">
        Checking integrations…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!health) return null;

  const insConfig = statusConfig[health.insforge];
  const jgConfig = statusConfig[health.jungle_grid];
  const allGood = health.insforge === "connected" && health.jungle_grid === "connected";

  return (
    <div
      className={`rounded-xl border px-5 py-3 flex flex-wrap items-center gap-4 text-sm ${
        allGood
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-yellow-500/20 bg-yellow-500/5"
      }`}
    >
      {health.demo_mode && (
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/20">
          Demo Mode
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${insConfig.dot}`} />
        <span className="text-white/50">InsForge</span>
        <span className={insConfig.text}>{insConfig.label}</span>
      </div>
      <div className="h-3 w-px bg-white/10 hidden sm:block" />
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${jgConfig.dot}`} />
        <span className="text-white/50">Jungle Grid</span>
        <span className={jgConfig.text}>{jgConfig.label}</span>
      </div>
      {(!allGood) && (
        <p className="w-full text-xs text-white/30 mt-1">
          {health.insforge !== "connected"
            ? "InsForge credentials are not set. Check INSFORGE_PROJECT_URL, INSFORGE_API_KEY, and INSFORGE_PROJECT_ID."
            : "Jungle Grid is not configured. Set JUNGLE_GRID_API_KEY to enable job submission."}
        </p>
      )}
    </div>
  );
}
