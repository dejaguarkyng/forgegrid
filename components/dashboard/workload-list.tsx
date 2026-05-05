"use client";

import type { Workload, WorkloadStatus } from "@/lib/insforge";

interface WorkloadListProps {
  workloads: Workload[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (workload: Workload) => void;
}

const statusBadge: Record<WorkloadStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-zinc-500/20 text-zinc-400 border-zinc-500/20" },
  submitting: { label: "Submitting", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20" },
  queued: { label: "Queued", cls: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
  running: { label: "Running", cls: "bg-purple-500/20 text-purple-400 border-purple-500/20" },
  completed: { label: "Completed", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" },
  failed: { label: "Failed", cls: "bg-red-500/20 text-red-400 border-red-500/20" },
};

function StatusBadge({ status }: { status: WorkloadStatus }) {
  const config = statusBadge[status] ?? statusBadge.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.cls}`}>
      {config.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorkloadList({ workloads, loading, selectedId, onSelect }: WorkloadListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-white/5 bg-white/3 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (workloads.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-8 text-center text-sm text-white/30">
        No workloads yet. Submit one using the form.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {workloads.map((w) => (
        <li key={w.id}>
          <button
            onClick={() => onSelect(w)}
            className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
              selectedId === w.id
                ? "border-indigo-500/40 bg-indigo-500/10"
                : "border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{w.name}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  {w.workload_type} · {w.model_size}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusBadge status={w.status as WorkloadStatus} />
                <span className="text-[11px] text-white/25">{formatDate(w.created_at)}</span>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export { StatusBadge };
